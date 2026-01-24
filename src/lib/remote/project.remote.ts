import { eq, inArray } from "drizzle-orm";
import * as v from "valibot";
import { error, redirect } from "@sveltejs/kit";
import { form, getRequestEvent, query } from "$app/server";
import db, { projects, projectMembers, users } from "$db";
import { ProjectId, ProjectInfo, ProjectFull } from "$types";

//////////////////////
// getProject query //
//////////////////////

const getProjectInternal = async (projectId: ProjectId) => {
  const projectRaw = await db.transaction(async tx => {
    const [project] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      throw error(404);
    }

    const memberRows = await tx
      .select({
        user: users,
        member: projectMembers,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, project.id));

    const admins: ProjectFull["admins"] = [];
    const contributors: ProjectFull["contributors"] = [];
    const viewers: ProjectFull["viewers"] = [];

    for (const row of memberRows) {
      if (row.member.role === "admin") {
        admins.push({
          ...row.member,
          ...row.user,
        });
      } else if (row.member.role === "contributor") {
        contributors.push({
          ...row.member,
          ...row.user,
        });
      } else if (row.member.role === "viewer") {
        viewers.push({
          ...row.member,
          ...row.user,
        });
      } else {
        console.error(
          `Member ${row.user.id} of project ${project.id} has no role`,
        );
      }
    }

    return {
      ...project,
      admins,
      contributors,
      viewers,
    } satisfies ProjectFull;
  });

  const project = v.parse(ProjectFull, projectRaw);
  return project;
};

export const getProject = query(ProjectId, projectId => {
  const session = getRequestEvent().locals.session;
  if (!session) {
    throw error(401, "Must be logged in");
  }

  return getProjectInternal(projectId);
});

///////////////////////
// getProjects query //
///////////////////////

export const getProjects = query(async () => {
  const session = getRequestEvent().locals.session;
  if (!session) {
    throw error(401, "Must be logged in");
  }

  const projectsRes = await db
    .select({
      project: projects,
      member: projectMembers,
      user: users,
    })
    .from(projects)
    .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.userId, session.userId));

  const mapped = projectsRes.map(pr => pr.project);

  const projectList = v.parse(
    v.array(ProjectInfo),
    mapped satisfies ProjectInfo[],
  );

  return projectList;
});

//////////////////////////
// getAllProjects query //
//////////////////////////

export const getAllProjects = query(async () => {
  const event = getRequestEvent();
  const session = event.locals.session;
  if (!session) {
    throw error(401);
  } else if (session.platformRole !== "admin") {
    throw error(403);
  }

  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      imageUrl: projects.imageUrl,
    })
    .from(projects);

  return v.parse(v.array(ProjectInfo), allProjects satisfies ProjectInfo[]);
});

////////////////////////////
// getActiveProject query //
////////////////////////////

export const getActiveProject = query(async () => {
  const event = getRequestEvent();
  const session = event.locals.session;
  if (!session) {
    return null;
  }

  const projectId = event.cookies.get("activeProject") as ProjectId;
  if (!projectId) {
    return null;
  }

  return getProjectInternal(projectId);
});

//////////////////////
// pickProject form //
//////////////////////

export const pickProject = form(
  v.object({
    projectId: v.optional(ProjectId),
  }),
  async ({ projectId }) => {
    const event = getRequestEvent();
    if (!event.locals.session) {
      throw error(401);
    }

    if (projectId) {
      event.cookies.set("activeProject", projectId, { path: "/" });
      const project = await getProjectInternal(projectId);
      getActiveProject().set(project);
    } else {
      event.cookies.delete("activeProject", { path: "/" });
      getActiveProject().set(null);
    }
  },
);

////////////////////////
// createProject form //
////////////////////////

export const createProject = form(
  v.object({
    name: v.string(),
  }),
  async ({ name }) => {
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    }

    if (session.platformRole !== "admin") {
      throw error(403, "Non-admin accounts cannot create projects");
    }

    const newProjectId = await db.transaction(async tx => {
      const [newProject] = await tx
        .insert(projects)
        .values({ name })
        .returning({
          id: projects.id,
        });

      await tx.insert(projectMembers).values({
        projectId: newProject.id,
        userId: session.userId,
        role: "admin",
      });

      return newProject.id;
    });

    event.cookies.set("activeProject", newProjectId, { path: "/" });

    getAllProjects().refresh();
    getProjects().refresh();

    redirect(303, `/project/${newProjectId}`);
  },
);
