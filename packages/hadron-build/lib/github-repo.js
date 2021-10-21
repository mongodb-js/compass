
const fs = require('fs');
const path = require('path');
const preload = require('semver/preload');

class GithubRepo {
  constructor(repo, octokit) {
    this.octokit = octokit;
    this.repo = Object.freeze({ ...repo });
  }
  /**
     * Returns the most recent draft tag for the given release version (without leading `v`).
     */
  async getMostRecentDraftTagForRelease(releaseVersion) {
    if (!releaseVersion) {
      return undefined;
    }
    const sortedTags = (await this.getTagsOrdered())
      .filter(t => t.name && t.name.startsWith(`v${releaseVersion}-draft`) && t.name.match(/^v\d+\.\d+\.\d+-draft\.\d+/));
    const mostRecentTag = sortedTags[0];
    return mostRecentTag ? {
      name: mostRecentTag.name,
      sha: mostRecentTag.sha
    } : undefined;
  }
  /**
     * Returns the predecessor release tag of the given release (without leading `v`).
     * @param releaseVersion The successor release
     */
  async getPreviousReleaseTag(releaseVersion) {
    const releaseSemver = preload.default.parse(releaseVersion);
    if (!releaseSemver) {
      return undefined;
    }
    return (await this.getTagsOrdered())
      .filter(t => t.name.match(/^v\d+\.\d+\.\d+$/))
      .find(t => {
        const tagSemver = preload.default.parse(t.name);
        return tagSemver && tagSemver.compare(releaseSemver) < 0;
      });
  }
  /**
     * Get all tags from the Github repository, sorted by highest version to lowest version.
     */
  async getTagsOrdered() {
    const tags = await this.octokit
      .paginate('GET /repos/:owner/:repo/tags', this.repo);
    return tags.map(t => ({
      name: t.name,
      sha: t.commit.sha,
    })).sort((t1, t2) => -1 * preload.default.compare(t1.name, t2.name));
  }
  /**
     * Creates a new draft release or updates an existing draft release for the given details.
     * An existing release is discovered by a matching tag.
     *
     * @param release The release details
     */
  async updateDraftRelease(release) {
    const existingRelease = await this.getReleaseByTag(release.tag);
    if (!existingRelease) {
      await this.octokit.repos.createRelease({
        ...this.repo,
        tag_name: release.tag,
        name: release.name,
        body: release.notes,
        draft: true
      }).catch(this._ignoreAlreadyExistsError());
    } else if (!existingRelease.draft) {
      throw new Error('Cannot update an existing release after it was published');
    } else {
      await this.octokit.repos.updateRelease({
        ...this.repo,
        release_id: existingRelease.id,
        tag_name: release.tag,
        name: release.name,
        body: release.notes,
        draft: true
      });
    }
  }
  /**
     * Uploads an asset for a Github release, if the assets already exists
     * it will be removed and re-uploaded.
     */
  async uploadReleaseAsset(releaseTag, asset) {
    const releaseDetails = await this.getReleaseByTag(releaseTag);
    if (releaseDetails === undefined) {
      throw new Error(`Could not look up release for tag ${releaseTag}`);
    }
    const assetName = asset.name ? asset.name : path.default.basename(asset.path);
    const existingAsset = releaseDetails.assets ? releaseDetails.assets.find(a => a.name === assetName) : undefined;
    if (existingAsset) {
      await this.octokit.repos.deleteReleaseAsset({
        ...this.repo,
        asset_id: existingAsset.id
      });
    }
    const params = {
      method: 'POST',
      url: releaseDetails.upload_url,
      headers: asset.contentType ? {
        'content-type': asset.contentType
      } : {},
      name: assetName,
      data: await fs.promises.readFile(asset.path)
    };
    await this.octokit.request(params);
  }
  async getReleaseByTag(tag) {
    const releases = await this.octokit
      .paginate('GET /repos/:owner/:repo/releases', this.repo);
    return releases.find(({ tag_name }) => tag_name === tag);
  }
  async promoteRelease(config) {
    const tag = `v${config.version}`;
    const releaseDetails = await this.getReleaseByTag(tag);
    if (!releaseDetails) {
      throw new Error(`Release for ${tag} not found.`);
    }
    if (!releaseDetails.draft) {
      console.info(`Release for ${tag} is already public.`);
      return releaseDetails.html_url;
    }
    const params = {
      ...this.repo,
      release_id: releaseDetails.id,
      draft: false
    };
    await this.octokit.repos.updateRelease(params);
    return releaseDetails.html_url;
  }
  /**
     * Creates a new branch pointing to the latest commit of the given source branch.
     * @param branchName The name of the branch (not including refs/heads/)
     * @param sourceSha The SHA hash of the commit to branch off from
     */
  async createBranch(branchName, sourceSha) {
    await this.octokit.git.createRef({
      ...this.repo,
      ref: `refs/heads/${branchName}`,
      sha: sourceSha
    });
  }
  /**
     * Retrieves the details of the given branch.
     * @param branchName The name of the branch (not including refs/heads/)
     */
  async getBranchDetails(branchName) {
    const result = await this.octokit.git.getRef({
      ...this.repo,
      ref: `heads/${branchName}`
    });
    return result.data;
  }
  /**
     * Removes the given branch by deleting the corresponding ref.
     * @param branchName The branch name to remove (not including refs/heads/)
     */
  async deleteBranch(branchName) {
    await this.octokit.git.deleteRef({
      ...this.repo,
      ref: `heads/${branchName}`
    });
  }
  /**
     * Gets the content of the given file from the repository.
     * Assumes the loaded file is a utf-8 encoded text file.
     *
     * @param pathInRepo Path to the file from the repository root
     * @param branchOrTag Branch/tag name to load content from
     */
  async getFileContent(pathInRepo, branchOrTag) {
    const response = await this.octokit.repos.getContents({
      ...this.repo,
      path: pathInRepo,
      ref: branchOrTag
    });
    if (response.data.type !== 'file') {
      throw new Error(`${pathInRepo} does not reference a file`);
    } else if (response.data.encoding !== 'base64') {
      throw new Error(`Octokit returned unexpected encoding: ${response.data.encoding}`);
    }
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    return {
      blobSha: response.data.sha,
      content
    };
  }
  /**
     * Updates the content of a given file in the repository.
     * Assumes the given file content is utf-8 encoded text.
     *
     * @param message The commit message
     * @param baseSha The blob SHA of the file to update
     * @param pathInRepo Path to the file from the repository root
     * @param newContent New file content
     * @param branch Branch name to commit to
     */
  async commitFileUpdate(message, baseSha, pathInRepo, newContent, branch) {
    const response = await this.octokit.repos.createOrUpdateFile({
      ...this.repo,
      message,
      content: Buffer.from(newContent, 'utf-8').toString('base64'),
      path: pathInRepo,
      sha: baseSha,
      branch
    });
    return {
      blobSha: response.data.content.sha,
      commitSha: response.data.commit.sha
    };
  }
  async createPullRequest(title, description, fromBranch, toBaseBranch) {
    const response = await this.octokit.pulls.create({
      ...this.repo,
      base: toBaseBranch,
      head: fromBranch,
      title,
      body: description
    });
    return {
      prNumber: response.data.number,
      url: response.data.html_url
    };
  }
  async mergePullRequest(prNumber) {
    await this.octokit.pulls.merge({
      ...this.repo,
      pull_number: prNumber
    });
  }
  _ignoreAlreadyExistsError() {
    return async(error) => {
      if (this._isAlreadyExistsError(error)) {
        return;
      }
      throw error;
    };
  }
  _isAlreadyExistsError(error) {
    return error.name === 'HttpError' &&
            error.status === 422 &&
            error.errors &&
            error.errors.length === 1 &&
            error.errors[0].code === 'already_exists';
  }
}

module.exports = { GithubRepo };
