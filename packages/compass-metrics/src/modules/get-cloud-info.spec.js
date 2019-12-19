const getCloudInfo = require('./get-cloud-info');


describe('getCloudInfo', () => {
  it('returns all false for undefined', async() => {
    const cloudInfo = await getCloudInfo();
    expect(cloudInfo).to.deep.equal({
      is_aws: false,
      is_gcp: false,
      is_azure: false
    });
  });


  it('returns all false for localhost', async() => {
    const cloudInfo = await getCloudInfo('localhost');
    expect(cloudInfo).to.deep.equal({
      is_aws: false,
      is_gcp: false,
      is_azure: false
    });
  });

  it('works with local ip address (127.0.0.1)', async() => {
    const cloudInfo = await getCloudInfo('127.0.0.1');
    expect(cloudInfo).to.deep.equal({
      is_aws: false,
      is_gcp: false,
      is_azure: false
    });
  });

  it('returns {is_aws: true} if hostname is an AWS ip', async() => {
    const cloudInfo = await getCloudInfo('13.248.118.1');
    expect(cloudInfo).to.deep.equal({
      is_aws: true,
      is_gcp: false,
      is_azure: false
    });
  });

  it('returns {is_gcp: true} if hostname is a GCP ip', async() => {
    const cloudInfo = await getCloudInfo('8.34.208.1');
    expect(cloudInfo).to.deep.equal({
      is_aws: false,
      is_gcp: true,
      is_azure: false
    });
  });

  it('returns {is_azure: true} if hostname is an Azure ip', async() => {
    const cloudInfo = await getCloudInfo('13.64.151.161');
    expect(cloudInfo).to.deep.equal({
      is_aws: false,
      is_gcp: false,
      is_azure: true
    });
  });
});

