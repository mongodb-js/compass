import type {
  PreferencesAccess,
  UserConfigurablePreferences,
} from 'compass-preferences-model';
import { preferencesAccess } from 'compass-preferences-model';
import { pick } from '../utils/pick';

// Wrapper class for preferences to be able to pass it as a thunk extra arg
// service
export class PreferencesSandbox {
  private _sandbox: PreferencesAccess | null = null;
  private get sandbox() {
    if (!this._sandbox) {
      throw new Error('Trying to access sandbox before setup was called');
    }
    return this._sandbox;
  }
  constructor(
    private preferences: Pick<
      typeof preferencesAccess,
      | 'createSandbox'
      | 'ensureDefaultConfigurableUserPreferences'
      | 'getPreferences'
      | 'savePreferences'
    > = preferencesAccess
  ) {}

  async setupSandbox() {
    this._sandbox = await this.preferences.createSandbox();
  }

  async updateField<T extends keyof UserConfigurablePreferences>(
    field: T,
    value: UserConfigurablePreferences[T]
  ) {
    await this.sandbox.savePreferences({ [field]: value });
  }

  async getSandboxState() {
    const [userPreferences, preferenceStates] = await Promise.all([
      this.sandbox.getConfigurableUserPreferences(),
      this.sandbox.getPreferenceStates(),
    ]);
    const updatedFields = (
      Object.keys(userPreferences) as (keyof typeof userPreferences)[]
    ).filter(
      (k) =>
        userPreferences[k] !== this.preferences.getPreferences()[k] &&
        preferenceStates[k] === undefined
    );
    return { userPreferences, preferenceStates, updatedFields };
  }

  async applySandboxChangesToPreferences() {
    const { userPreferences, updatedFields } = await this.getSandboxState();
    await this.preferences.savePreferences(
      pick(userPreferences, updatedFields)
    );
  }
}
