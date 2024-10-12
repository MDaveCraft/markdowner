export interface Env {
  BACKEND_SECURITY_TOKEN:string
}

export interface DurableObject {
  setAlarm(timeout: number):Promise<void>;
}

export interface ReturnVal<T> {
  error?: string;
  data?: T;
}