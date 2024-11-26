import { useEffect, useState } from "react";
import { getAllTasks, saveTask } from "../utils/localStorageUtils";
import {
  Button,
  Card,
  Flex,
  Grid,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
  Menu,
  Checkbox,
  TextInput,
} from "@mantine/core";
import { Task } from "./Task";
import { TaskInterface } from "../interfaces";
import { statusType } from "../interfaces";
import {
  IconArrowsSort,
  IconCirclePlus,
  IconFilter,
  IconFilterFilled,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DroppableColumn } from "./DroppableColumn";
import { generateUniqueId } from "../utils/returnUniqueId";

export const Dashboard = () => {
  const uuid = generateUniqueId();
  const [allGroupedTasks, setAllGroupedTasks] = useState<{
    [key in statusType]: TaskInterface[];
  }>({
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  });
  const [sortedObj, setSortedObj] = useState<{
    [key in statusType]: null | "asc" | "desc";
  }>({
    PENDING: null,
    IN_PROGRESS: null,
    COMPLETED: null,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterSelected, setFilterSelected] = useState<statusType[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchedTasks, setSearchedTasks] = useState<{
    [key in statusType]: TaskInterface[];
  }>({
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  });

  useEffect(() => {
    const groupedTasks = getAllTasks();
    setAllGroupedTasks(groupedTasks);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),

    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeId === overId) return;

    const sourceStatus: statusType = activeData.status;
    const destinationStatus: statusType = overData.status;

    setAllGroupedTasks((prevTasks) => {
      const sourceTasks = [...prevTasks[sourceStatus]];
      const activeIndex = sourceTasks.findIndex((task) => task.id == activeId);
      const [movedTask] = sourceTasks.splice(activeIndex, 1);

      let destinationTasks = [...prevTasks[destinationStatus]];

      if (sourceStatus === destinationStatus) {
        // Reordering within the same column
        const overIndex = destinationTasks.findIndex(
          (task) => task.id == overId
        );
        destinationTasks = arrayMove(destinationTasks, activeIndex, overIndex);
      } else {
        if (overData.type === "task") {
          const overIndex = destinationTasks.findIndex(
            (task) => task.id == overId
          );
          destinationTasks.splice(overIndex, 0, movedTask);
        } else {
          destinationTasks.push(movedTask);
        }
      }

      movedTask.status = destinationStatus;

      const finalObj = {
        ...prevTasks,
        [sourceStatus]: sourceTasks,
        [destinationStatus]: destinationTasks,
      };

      saveTask(finalObj);
      return finalObj;
    });

    setSortedObj((prev) => ({
      ...prev,
      [sourceStatus]: null,
      [destinationStatus]: null,
    }));

    localStorage.setItem(
      "sortedObj",
      JSON.stringify({
        ...sortedObj,
        [sourceStatus]: null,
        [destinationStatus]: null,
      })
    );
  };

  const handleSort = (status: statusType, order: "asc" | "desc") => {
    let tempSortObj = {
      ...sortedObj,
      [status]: order,
    };
    setSortedObj({
      ...sortedObj,
      [status]: order,
    });
    localStorage.setItem("sortedObj", JSON.stringify(tempSortObj));

    let tempGroupedObj = {
      ...allGroupedTasks,
      [status]: allGroupedTasks[status].sort(
        (a, b) =>
          (order === "asc" ? 1 : -1) *
          (new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      ),
    };
    setAllGroupedTasks(tempGroupedObj);
    saveTask(tempGroupedObj);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    let searchedTasks: { [key in statusType]: TaskInterface[] } = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };
    (Object.keys(allGroupedTasks) as statusType[]).forEach((status) => {
      allGroupedTasks[status].forEach((task: TaskInterface) => {
        if (
          task.title?.toLowerCase().includes(value.toLowerCase()) ||
          task.description.toLowerCase().includes(value.toLowerCase())
        ) {
          searchedTasks[status].push(task);
        }
      });
    });

    setSearchedTasks(searchedTasks);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => {
        setActiveId(event.active.id.toString());
      }}
      onDragEnd={(e) => {
        handleDragEnd(e);
        setActiveId(null);
      }}
    >
      <Stack mih={"100vh"} p={16} align="center">
        <Flex miw="100%" justify={"space-between"} align={"center"}>
          <Text fw={600} size="xl" fz={"h1"}>
            Tasks
          </Text>
          <Flex gap={16} align={"center"}>
            <TextInput
              value={searchInput}
              onChange={(event) => handleSearch(event.currentTarget.value)}
              placeholder="Search by title or description"
              miw={205}
            />

            <Menu>
              <Menu.Target>
                <ActionIcon variant="transparent" color={"black"}>
                  {filterSelected.length ? (
                    <IconFilterFilled />
                  ) : (
                    <IconFilter />
                  )}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  onClick={() =>
                    setFilterSelected((prev: statusType[]) => {
                      const newPrev = [...prev];
                      if (newPrev?.includes("PENDING")) {
                        return newPrev?.filter(
                          (status) => status !== "PENDING"
                        );
                      } else {
                        newPrev[0] = "PENDING";
                        return newPrev;
                      }
                    })
                  }
                  leftSection={
                    <Checkbox
                      color="gray"
                      checked={filterSelected?.includes("PENDING")}
                    />
                  }
                >
                  Pending
                </Menu.Item>
                <Menu.Item
                  onClick={() =>
                    setFilterSelected((prev: statusType[]) => {
                      const newPrev = [...prev];
                      if (newPrev?.includes("IN_PROGRESS")) {
                        return newPrev?.filter(
                          (status) => status !== "IN_PROGRESS"
                        );
                      } else {
                        newPrev[prev.includes("PENDING") ? 1 : 0] =
                          "IN_PROGRESS";
                        return newPrev;
                      }
                    })
                  }
                  leftSection={
                    <Checkbox
                      color={"yellow"}
                      checked={filterSelected?.includes("IN_PROGRESS")}
                    />
                  }
                >
                  In Progress
                </Menu.Item>
                <Menu.Item
                  onClick={() =>
                    setFilterSelected((prev: statusType[]) => {
                      const newPrev = [...prev];
                      if (newPrev?.includes("COMPLETED")) {
                        return newPrev?.filter(
                          (status) => status !== "COMPLETED"
                        );
                      } else {
                        newPrev.push("COMPLETED");
                        return newPrev;
                      }
                    })
                  }
                  leftSection={
                    <Checkbox
                      color={"green"}
                      checked={filterSelected?.includes("COMPLETED")}
                    />
                  }
                >
                  Completed
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button
              onClick={() => {
                saveTask({
                  ...allGroupedTasks,
                  PENDING: allGroupedTasks.PENDING.concat({
                    id: uuid,
                    title: "",
                    description: "",
                    status: "PENDING",
                    dueDate: null,
                  }),
                });
                setAllGroupedTasks(getAllTasks());
              }}
              variant="default"
            >
              Create new task
            </Button>
          </Flex>
        </Flex>

        {allGroupedTasks.COMPLETED.length > 0 ||
        allGroupedTasks.IN_PROGRESS.length ||
        allGroupedTasks.PENDING.length > 0 ? (
          <Grid miw={"100%"} p={32} justify="center">
            {(
              (filterSelected.length && filterSelected) ||
              (["PENDING", "IN_PROGRESS", "COMPLETED"] as statusType[])
            ).map((status) => (
              <Grid.Col
                m={16}
                p={16}
                bg={
                  status === "PENDING"
                    ? "gray.1"
                    : status === "IN_PROGRESS"
                    ? "yellow.1"
                    : "green.1"
                }
                component={Card}
                mih={{ base: "25vh", lg: "100vh" }}
                span={{ base: 12, md: 5.5, lg: 3.5 }}
                // style={{ gap: 16 }}
              >
                <DroppableColumn id={status}>
                  <SortableContext
                    items={allGroupedTasks[status].map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Flex justify={"space-between"} align={"center"}>
                      <div></div>
                      <Text
                        fw={700}
                        mb={16}
                        size="xl"
                        fz={"h3"}
                        ta={"center"}
                        tt={"capitalize"}
                        c={
                          status === "PENDING"
                            ? "gray.9"
                            : status === "IN_PROGRESS"
                            ? "yellow.9"
                            : "green.9"
                        }
                      >
                        {status.toLowerCase().replace("_", " ")}
                      </Text>

                      <Menu position="bottom-end">
                        <Tooltip
                          label={
                            sortedObj[status] === "asc"
                              ? "Sorted by earliest date"
                              : sortedObj[status] === "desc"
                              ? "Sorted by latest date"
                              : "Sort by date"
                          }
                        >
                          <Menu.Target>
                            <ActionIcon
                              style={{ marginBottom: 16 }}
                              variant="transparent"
                            >
                              {sortedObj[status] === "desc" ? (
                                <IconSortAscending
                                  color={
                                    status === "PENDING"
                                      ? "#212529"
                                      : status === "IN_PROGRESS"
                                      ? "#e67700"
                                      : "#2b8a3e"
                                  }
                                />
                              ) : sortedObj[status] === "asc" ? (
                                <IconSortDescending
                                  color={
                                    status === "PENDING"
                                      ? "#212529"
                                      : status === "IN_PROGRESS"
                                      ? "#e67700"
                                      : "#2b8a3e"
                                  }
                                />
                              ) : (
                                <IconArrowsSort
                                  color={
                                    status === "PENDING"
                                      ? "#212529"
                                      : status === "IN_PROGRESS"
                                      ? "#e67700"
                                      : "#2b8a3e"
                                  }
                                />
                              )}
                            </ActionIcon>
                          </Menu.Target>
                        </Tooltip>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconSortAscending />}
                            onClick={() => handleSort(status, "desc")}
                          >
                            Sort down by latest
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconSortDescending />}
                            onClick={() => handleSort(status, "asc")}
                          >
                            Sort down by earliest
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Flex>
                    <Stack gap={16}>
                      {/* {allGroupedTasks[status].map((task: TaskInterface) => ( */}
                      {(searchInput ? searchedTasks : allGroupedTasks)[
                        status
                      ].map((task: TaskInterface) => (
                        <Task
                          allGroupedTasks={allGroupedTasks}
                          setAllGroupedTasks={setAllGroupedTasks}
                          status={task.status}
                          id={task?.id}
                          key={task.id}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DroppableColumn>
              </Grid.Col>
            ))}
          </Grid>
        ) : (
          <Stack align="center" gap={4}>
            <Text fw={400} size="xl" fz={"h2"}>
              There are no tasks
            </Text>
            <Text fw={400} c={"gray"}>
              Click to create one
            </Text>
            <ActionIcon
              onClick={() => {
                // addTask(uuid);
                // setAllGroupedTasks(returnGroupedTaskObject(getAllTasks()));

                saveTask({
                  ...allGroupedTasks,
                  PENDING: allGroupedTasks.PENDING.concat({
                    id: uuid,
                    title: "",
                    description: "",
                    status: "PENDING",
                    dueDate: null,
                  }),
                });
                setAllGroupedTasks(getAllTasks());
              }}
              variant="transparent"
              color="gray"
              size={"xl"}
            >
              <IconCirclePlus size={"xl"} />
            </ActionIcon>
          </Stack>
        )}
      </Stack>

      <DragOverlay>
        {activeId ? (
          <Task
            id={activeId}
            allGroupedTasks={allGroupedTasks}
            setAllGroupedTasks={setAllGroupedTasks}
            status={
              Object.values(allGroupedTasks)
                .flat()
                .find((task) => task.id === activeId)?.status!
            }
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
