"use client";

import TaskFilters from "@/components/ui/task-filters";

export default function Default() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <TaskFilters
        availableAssignees={[
          { id: "1", name: "Alex Morgan" },
          { id: "2", name: "Jamie Lee" },
          { id: "3", name: "Taylor Reed" },
        ]}
        availableProjects={[
          { id: "p1", name: "Website Redesign" },
          { id: "p2", name: "Mobile App" },
        ]}
        availableTags={["design", "bug", "feature"]}
        onFilterChange={(filter) => console.log(filter)}
      />
    </div>
  );
}
export { Default as TaskFiltersDemo };
