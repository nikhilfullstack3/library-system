const STORAGE_KEY = "library-system-app-state";

export function loadStoredAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {
        session: null,
        dashboard: null,
        studentProfile: null,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      session: parsed.session || null,
      dashboard: parsed.dashboard || null,
      studentProfile: parsed.studentProfile || null,
    };
  } catch {
    return {
      session: null,
      dashboard: null,
      studentProfile: null,
    };
  }
}

export function storeAppState(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
