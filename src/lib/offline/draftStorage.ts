export function saveDraft(formId: string, data: unknown): void {
  try {
    localStorage.setItem(`draft_${formId}`, JSON.stringify(data))
  } catch {
    console.warn('[DraftStorage] Could not save draft')
  }
}

export function loadDraft<T>(formId: string): T | null {
  try {
    const raw = localStorage.getItem(`draft_${formId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDraft(formId: string): void {
  localStorage.removeItem(`draft_${formId}`)
}
