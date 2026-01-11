import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { error } from "@sveltejs/kit";
import { getRequestEvent, command, query } from "$app/server";
import db, { projects, projectMembers, users } from "$db";
import { ProjectId, ProjectInfo, ProjectFull } from "$types";

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

  const projectList = ProjectInfo.array().parse(mapped satisfies ProjectInfo[]);

  return projectList;
});

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
    const clean = ProjectFull.parse(dirty satisfies ProjectFull);
    return clean;
  };
});

export const setActiveProject = command(
  ProjectId.nullable(),
  async projectId => {
    // authenticate
    const event = getRequestEvent();
    if (!event.locals.session) {
      throw error(401);
    }
    const userId = event.locals.session.userId;

    // unset if null
    if (!projectId) {
      event.cookies.delete("activeProject", { path: "/" });
      return;
    }

    // check membership
    const [membership] = await db
      .select({ id: projects.id, userId: projectMembers.userId })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        and(eq(projectMembers.userId, userId), eq(projects.id, projectId)),
      );

    if (membership) {
      event.cookies.set("activeProject", projectId, { path: "/" });
    } else {
      throw error(404);
    }
  },
);

export const createProject = command(
  z.object({
    name: z.string(),
  }),
  async ({ name }) => {
    // authenticate
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    }

    const newProjectId = await db.transaction(async tx => {
      const res = await tx
        .insert(projects)
        .values({
          name: name,
        })
        .returning();
      const projectId = res[0].id;

      await tx.insert(projectMembers).values({
        userId: session.userId,
        projectId,
        role: "admin",
      });

      return projectId;
    });

    event.cookies.set("activeProject", newProjectId, { path: "/" });

    getProjects().refresh();
  },
);
