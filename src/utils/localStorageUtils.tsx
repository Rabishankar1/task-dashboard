import { statusType, TaskInterface } from "../interfaces";

const parseJSON = (data: string | null): any => {
  try {
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const saveTask = (allGroupedTasks: {
  [key in statusType]: TaskInterface[];
}) => {
  localStorage.setItem("allGroupedTasks", JSON.stringify(allGroupedTasks));
};

export const getAllTasks = (): {
  [key in statusType]: TaskInterface[];
} => {
  const allTasks = parseJSON(localStorage.getItem("allGroupedTasks"));
  if (Object.keys(allTasks).length !== 3) {
    localStorage.setItem(
      "allGroupedTasks",
      JSON.stringify({
        PENDING: [],
        IN_PROGRESS: [],
        COMPLETED: [],
      })
    );

    localStorage.setItem(
      "sortedObj",
      JSON.stringify({
        PENDING: null,
        IN_PROGRESS: null,
        COMPLETED: null,
      })
    );
    return {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };
  }
  return allTasks;
};

export const getTask = (id: string): TaskInterface => {
  const allTasksObj = getAllTasks();
  let requiredTaskObj: TaskInterface | null = null;
  for (const status of [
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
  ] as statusType[]) {
    for (const task of allTasksObj[status]) {
      if (task.id === id) {
        requiredTaskObj = task;
        break;
      }
    }
    if (requiredTaskObj) {
      break;
    }
  }
  return requiredTaskObj ?? ({} as TaskInterface);
};
