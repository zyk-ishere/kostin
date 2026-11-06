export type ActionState = { ok: boolean; message: string } | null;

export function errorState(message: string): ActionState {
  return { ok: false, message };
}

export function okState(message: string): ActionState {
  return { ok: true, message };
}
