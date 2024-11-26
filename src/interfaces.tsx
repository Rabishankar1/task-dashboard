export type statusType = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export interface TaskInterface {
  id: string;
  title?: string;
  description: string;
  status: statusType; //default pending
  dueDate?: Date | null;
}
export type groupTaskInterface = {
  [key in statusType]: TaskInterface[];
};