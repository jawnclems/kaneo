import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { projectSchema, projectValueEntrySchema } from "../schemas";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import archiveProjectCtrl from "./controllers/archive-project";
import completeProjectCtrl from "./controllers/complete-project";
import createProjectCtrl from "./controllers/create-project";
import createProjectValueEntryCtrl from "./controllers/create-project-value-entry";
import deleteProjectCtrl from "./controllers/delete-project";
import deleteProjectValueEntryCtrl from "./controllers/delete-project-value-entry";
import getCompletedProjectsCtrl from "./controllers/get-completed-projects";
import getProjectCtrl from "./controllers/get-project";
import getProjectValueEntriesCtrl from "./controllers/get-project-value-entries";
import getProjectsCtrl from "./controllers/get-projects";
import reopenProjectCtrl from "./controllers/reopen-project";
import unarchiveProjectCtrl from "./controllers/unarchive-project";
import updateProjectCtrl from "./controllers/update-project";

const project = new Hono<{
  Variables: {
    userId: string;
    workspaceId: string;
  };
}>()
  .get(
    "/",
    describeRoute({
      operationId: "listProjects",
      tags: ["Projects"],
      description: "Get all projects in a workspace",
      responses: {
        200: {
          description: "List of projects with statistics",
          content: {
            "application/json": { schema: resolver(v.array(projectSchema)) },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        workspaceId: v.string(),
        includeArchived: v.optional(v.string()),
      }),
    ),
    workspaceAccess.fromQuery(),
    async (c) => {
      const workspaceId = c.get("workspaceId");
      const { includeArchived } = c.req.valid("query");
      const projects = await getProjectsCtrl(
        workspaceId,
        includeArchived === "true",
      );
      return c.json(projects);
    },
  )
  .post(
    "/",
    describeRoute({
      operationId: "createProject",
      tags: ["Projects"],
      description: "Create a new project in a workspace",
      responses: {
        200: {
          description: "Project created successfully",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator(
      "json",
      v.object({
        name: v.string(),
        workspaceId: v.string(),
        icon: v.string(),
        slug: v.string(),
      }),
    ),
    workspaceAccess.fromBody(),
    async (c) => {
      const { name, icon, slug } = c.req.valid("json");
      const workspaceId = c.get("workspaceId");
      const newProject = await createProjectCtrl(workspaceId, name, icon, slug);
      return c.json(newProject);
    },
  )
  .get(
    "/completed",
    describeRoute({
      operationId: "listCompletedProjects",
      tags: ["Projects"],
      description:
        "Get all completed projects in a workspace with their value entries",
      responses: {
        200: {
          description: "List of completed projects",
          content: {
            "application/json": { schema: resolver(v.array(projectSchema)) },
          },
        },
      },
    }),
    validator(
      "query",
      v.object({
        workspaceId: v.string(),
      }),
    ),
    workspaceAccess.fromQuery(),
    async (c) => {
      const workspaceId = c.get("workspaceId");
      const projects = await getCompletedProjectsCtrl(workspaceId);
      return c.json(projects);
    },
  )
  .get(
    "/:id",
    describeRoute({
      operationId: "getProject",
      tags: ["Projects"],
      description: "Get a specific project by ID",
      responses: {
        200: {
          description: "Project details",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const projectData = await getProjectCtrl(id, workspaceId);
      return c.json(projectData);
    },
  )
  .put(
    "/:id",
    describeRoute({
      operationId: "updateProject",
      tags: ["Projects"],
      description: "Update an existing project",
      responses: {
        200: {
          description: "Project updated successfully",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        name: v.string(),
        icon: v.string(),
        slug: v.string(),
        description: v.string(),
        isPublic: v.boolean(),
      }),
    ),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const { name, icon, slug, description, isPublic } = c.req.valid("json");
      const workspaceId = c.get("workspaceId");
      const updatedProject = await updateProjectCtrl(
        id,
        name,
        icon,
        slug,
        description,
        isPublic,
        workspaceId,
      );
      return c.json(updatedProject);
    },
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "deleteProject",
      tags: ["Projects"],
      description: "Delete a project by ID",
      responses: {
        200: {
          description: "Project deleted successfully",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const deletedProject = await deleteProjectCtrl(id, workspaceId);
      return c.json(deletedProject);
    },
  )
  .put(
    "/:id/archive",
    describeRoute({
      operationId: "archiveProject",
      tags: ["Projects"],
      description: "Archive a project by ID",
      responses: {
        200: {
          description: "Project archived successfully",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const archivedProject = await archiveProjectCtrl(id, workspaceId);
      return c.json(archivedProject);
    },
  )
  .put(
    "/:id/unarchive",
    describeRoute({
      operationId: "unarchiveProject",
      tags: ["Projects"],
      description: "Unarchive a project by ID",
      responses: {
        200: {
          description: "Project unarchived successfully",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const unarchivedProject = await unarchiveProjectCtrl(id, workspaceId);
      return c.json(unarchivedProject);
    },
  )
  .put(
    "/:id/complete",
    describeRoute({
      operationId: "completeProject",
      tags: ["Projects"],
      description: "Mark a project as complete",
      responses: {
        200: {
          description: "Project completed successfully",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const completedProject = await completeProjectCtrl(id, workspaceId);
      return c.json(completedProject);
    },
  )
  .put(
    "/:id/reopen",
    describeRoute({
      operationId: "reopenProject",
      tags: ["Projects"],
      description: "Reopen a completed project",
      responses: {
        200: {
          description: "Project reopened successfully",
          content: {
            "application/json": { schema: resolver(projectSchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const reopenedProject = await reopenProjectCtrl(id, workspaceId);
      return c.json(reopenedProject);
    },
  )
  .get(
    "/:id/value",
    describeRoute({
      operationId: "getProjectValueEntries",
      tags: ["Projects"],
      description: "Get value entries for a project",
      responses: {
        200: {
          description: "List of value entries",
          content: {
            "application/json": {
              schema: resolver(v.array(projectValueEntrySchema)),
            },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const entries = await getProjectValueEntriesCtrl(id);
      return c.json(entries);
    },
  )
  .post(
    "/:id/value",
    describeRoute({
      operationId: "createProjectValueEntry",
      tags: ["Projects"],
      description: "Add a value entry to a project",
      responses: {
        200: {
          description: "Value entry created successfully",
          content: {
            "application/json": { schema: resolver(projectValueEntrySchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        title: v.string(),
        category: v.picklist([
          "cost_savings",
          "revenue",
          "efficiency",
          "quality",
          "other",
        ] as const),
        metric: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
    workspaceAccess.fromProject(),
    async (c) => {
      const { id } = c.req.valid("param");
      const { title, category, metric, description } = c.req.valid("json");
      const workspaceId = c.get("workspaceId");
      const entry = await createProjectValueEntryCtrl(
        id,
        workspaceId,
        title,
        category,
        metric,
        description,
      );
      return c.json(entry);
    },
  )
  .delete(
    "/:id/value/:entryId",
    describeRoute({
      operationId: "deleteProjectValueEntry",
      tags: ["Projects"],
      description: "Delete a value entry from a project",
      responses: {
        200: {
          description: "Value entry deleted successfully",
          content: {
            "application/json": { schema: resolver(projectValueEntrySchema) },
          },
        },
      },
    }),
    validator("param", v.object({ id: v.string(), entryId: v.string() })),
    workspaceAccess.fromProject(),
    async (c) => {
      const { entryId } = c.req.valid("param");
      const workspaceId = c.get("workspaceId");
      const deletedEntry = await deleteProjectValueEntryCtrl(
        entryId,
        workspaceId,
      );
      return c.json(deletedEntry);
    },
  );

export default project;
