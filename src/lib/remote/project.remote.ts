import { eq, inArray } from "drizzle-orm";
import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { command, form, getRequestEvent, query } from "$app/server";
import db, { projects, projectMembers, users } from "$db";
import { ProjectId, ProjectInfo, ProjectFull } from "$types";

//////////////////////
// getProject query //
//////////////////////

export const getProject = query.batch(ProjectId, async () => {
  const session = getRequestEvent().locals.session;
  if (!session) {
    throw error(401, "Must be logged in");
  }

  const [projectList, membersByProject] = await db.transaction(async tx => {
    const projectList = await tx
      .select({ project: projects })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, session.userId));

    const projectIds = projectList.map(row => row.project.id);

    const membersByProject = await tx
      .select({
        projectId: projects.id,
        user: users,
        member: projectMembers,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(inArray(projects.id, [...projectIds]));

    return [projectList, membersByProject];
  });

  const projectsMap: Map<ProjectId, ProjectFull> = new Map(
    projectList.map(row => [
      row.project.id,
      {
        ...row.project,
        admins: [],
        contributors: [],
        viewers: [],
      },
    ]),
  );

  // Assemble members list data
  for (const row of membersByProject) {
    const projectRef = projectsMap.get(row.projectId);

    if (!projectRef) {
      // this shouldn't happen
      console.warn(
        [
          "A sql query appears to be wrong",
          "in getProject remote function",
        ].join(" "),
      );
      continue;
    }

    if (row.member.role === "admin") {
      projectRef.admins.push({
        ...row.member,
        ...row.user,
      });
    } else if (row.member.role === "contributor") {
      projectRef.contributors.push({
        ...row.member,
        ...row.user,
      });
    } else if (row.member.role === "viewer") {
      projectRef.viewers.push({
        ...row.member,
        ...row.user,
      });
    }
  }

  return (projectId: ProjectId) => {
    const dirty = projectsMap.get(projectId);
    if (!dirty) {
      throw error(404);
    }
    const clean = v.parse(ProjectFull, dirty satisfies ProjectFull);
    return clean;
  };
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

export const getActiveProject = query(() => {
  const event = getRequestEvent();

  if (event.locals.session) {
    return (event.cookies.get("activeProject") as ProjectId) || null;
  } else {
    return null;
  }
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
      getActiveProject().set(projectId);
    } else {
      event.cookies.delete("activeProject", { path: "/" });
      getActiveProject().set(null);
    }
  },
);

///////////////////////////
// createProject command //
///////////////////////////

export const createProject = command(
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

    getProjects().refresh();

    return newProjectId;
  },
);
