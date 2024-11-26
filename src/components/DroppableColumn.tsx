import { useDroppable } from "@dnd-kit/core";

export const DroppableColumn = ({ id, children, ...props }: any) => {
    const { setNodeRef } = useDroppable({
      id,
      data: {
        type: 'column',
        status: id,
      },
    });
  
    return (
      <div ref={setNodeRef} {...props}>
        {children}
      </div>
    );
  };
  