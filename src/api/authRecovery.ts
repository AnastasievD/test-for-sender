type SessionExpiredHandler = () => void | Promise<void>;

let rotatePromise: Promise<void> | null = null;
let sessionExpiredPromise: Promise<void> | null = null;
let sessionGeneration = 0;
let sessionExpiredHandler: SessionExpiredHandler = () => undefined;

export const getSessionGeneration = () => sessionGeneration;

export const recoverSession = async (
  observedGeneration: number,
  rotate: () => Promise<void>,
) => {
  // Another request already completed the rotation after this request began.
  if (observedGeneration !== sessionGeneration) return;

  rotatePromise ??= rotate()
    .then(() => {
      sessionGeneration += 1;
    })
    .finally(() => {
      rotatePromise = null;
    });

  await rotatePromise;
};

export const notifySessionExpired = () => {
  sessionExpiredPromise ??= Promise.resolve(sessionExpiredHandler());
  return sessionExpiredPromise;
};

export const setSessionExpiredHandler = (handler: SessionExpiredHandler) => {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) {
      sessionExpiredHandler = () => undefined;
    }
  };
};

const advanceSessionGeneration = () => {
  sessionGeneration += 1;
  sessionExpiredPromise = null;
};

export const markSessionEstablished = advanceSessionGeneration;
export const markSessionEnded = advanceSessionGeneration;

export const resetAuthRecovery = () => {
  rotatePromise = null;
  sessionExpiredPromise = null;
  sessionGeneration = 0;
  sessionExpiredHandler = () => undefined;
};
