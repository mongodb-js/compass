// Exporting these in one place so we can track the same versions across the app
// and tests. If we just track latest, then future models could become the
// latest model and they could break backwards compatibility which will break
// released versions of Compass. By pinning to specific versions here, we can
// control when we want to update to newer models and we can make sure that
// we're using versions that work with the bundled versions of ai sdk libraries.
export const AI_MODEL_CHAT_VERSION = 'mongodb-chat-2.1-mini-reasoning';
export const AI_MODEL_SLIM_VERSION = 'mongodb-slim-2.1-mini';
