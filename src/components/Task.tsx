import {
  Flex,
  Textarea,
  TextInput,
  Menu,
  Card,
  ActionIcon,
} from "@mantine/core";
import { Dispatch, SetStateAction } from "react";

import { getTask, saveTask } from "../utils/localStorageUtils";
import { DateInput } from "@mantine/dates";
import { groupTaskInterface, statusType, TaskInterface } from "../interfaces";
import { IconCircle, IconCircleCheckFilled, IconX } from "@tabler/icons-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const returnStatusIcon = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return <IconCircle stroke={4} color="#ffd43b" />;
      break;
    case "COMPLETED":
      return <IconCircleCheckFilled color="green" />;
      break;
    default:
      return <IconCircle stroke={4} color="#e9ecef" />;
      break;
  }
};

export const Task = ({
  id,
  allGroupedTasks,
  setAllGroupedTasks,
  status,
}: {
  id: string;
  allGroupedTasks: {
    [key in statusType]: TaskInterface[];
  };
  setAllGroupedTasks: Dispatch<
    SetStateAction<{
      [key in statusType]: TaskInterface[];
    }>
  >;
  status: statusType;
}) => {
  let taskObject: TaskInterface = getTask(id);
  const { title, description, dueDate }: TaskInterface = taskObject || {};

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "task",
      status: taskObject.status,
    },
  });

  const handleEditField = <T extends keyof TaskInterface>(
    field: T,
    value: TaskInterface[T]
  ) => {
    taskObject[field] = value;
    if (field === "status") {
      const sourceStatus = status;
      const sourceTaskGroup = allGroupedTasks[sourceStatus];
      sourceTaskGroup.splice(
        sourceTaskGroup.findIndex((task) => task.id === id),
        1
      );

      const destinationStatus = value as statusType;
      const destinationTaskGroup: TaskInterface[] =
        allGroupedTasks[destinationStatus];
      destinationTaskGroup.push(taskObject);

      const finalObj = {
        ...allGroupedTasks,
        [sourceStatus]: sourceTaskGroup,
        [destinationStatus]: destinationTaskGroup,
      };

      saveTask(finalObj);
      return setAllGroupedTasks(finalObj);
    }

    taskObject[field] = value;
    let updatedTaskGroup = allGroupedTasks[status];
    updatedTaskGroup.splice(
      updatedTaskGroup.findIndex((task) => task.id === id),
      1,
      taskObject
    );

    setAllGroupedTasks((prevTasks: groupTaskInterface) => ({
      ...prevTasks,
      [taskObject.status]: updatedTaskGroup,
    }));

    saveTask({ ...allGroupedTasks, [taskObject.status]: updatedTaskGroup });
  };

  const handleDelete = () => {
    setAllGroupedTasks((prevTasks: groupTaskInterface) => ({
      ...prevTasks,
      [status]: prevTasks[status].filter((task) => task.id !== id),
    }));

    saveTask({
      ...allGroupedTasks,
      [status]: allGroupedTasks[status].filter((task) => task.id !== id),
    });
  };

  return (
    <Card
      data-testid="task-item"
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <Card.Section p={4}>
        <Flex justify={"flex-end"} w={"100%"}>
          <ActionIcon variant={"transparent"} onClick={handleDelete}>
            <IconX color="gray" onClick={handleDelete} />
          </ActionIcon>
        </Flex>
      </Card.Section>
      <Flex
        justify={"space-between"}
        align={"center"}
        style={{ width: "100%" }}
      >
        <Flex align={"center"} gap={8}>
          <Menu>
            <Menu.Target>{returnStatusIcon(status)}</Menu.Target>
            <Menu.Dropdown>
              {(["PENDING", "IN_PROGRESS", "COMPLETED"] as statusType[]).map(
                (status) => (
                  <Menu.Item
                    onClick={() => handleEditField("status", status)}
                    leftSection={returnStatusIcon(status)}
                  >
                    {status
                      .toLowerCase()
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </Menu.Item>
                )
              )}
            </Menu.Dropdown>
          </Menu>
          <TextInput
            variant="unstyled"
            placeholder="Task title"
            value={title}
            onChange={(e) => handleEditField("title", e.currentTarget.value)}
            styles={{
              input: {
                fontWeight: 700,
              },
            }}
          />
        </Flex>
        <DateInput
          placeholder="Due date"
          valueFormat="DD MMM YYYY"
          label="Due date"
          value={dueDate ? new Date(dueDate) : null}
          styles={{
            label: {
              color: "gray",
              fontWeight: 400,
            },
          }}
          onChange={(date) => {
            if (date) {
              handleEditField("dueDate", new Date(date));
            }
          }}
        />
      </Flex>
      <Flex>
        <Textarea
          value={description}
          onChange={(e) =>
            handleEditField("description", e.currentTarget.value)
          }
          variant="unstyled"
          placeholder="Task description"
        />
      </Flex>
    </Card>
  );
};
