export interface Env {

}

export interface DurableObject {
  setAlarm(timeout: number):Promise<void>;
}

export interface ReturnVal<T> {
  error?: string;
  data?: T;
}

export interface IDisposable {
  dispose(): void;
}