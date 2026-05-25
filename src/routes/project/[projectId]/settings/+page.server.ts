import { error, fail } from "@sveltejs/kit";
import db, { projects, projectMembers, users } from "$db";
import { eq, and, sql } from "drizzle-orm";
import { ProjectId, ProjectMemberRole, UserId } from "$types";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, "Must be logged in");
	}

	const projectId = params.projectId;

	// Fetch project
	const [project] = await db
		.select({ id: projects.id, name: projects.name })
		.from(projects)
		.where(eq(projects.id, projectId));

	if (!project) {
		error(404, "Project not found");
	}

	// Fetch member info
	const memberRows = await db
		.select({
			userId: users.id,
			name: users.name,
			email: users.email,
			role: projectMembers.role,
			joinedAt: projectMembers.createdAt,
		})
		.from(projectMembers)
		.innerJoin(users, eq(projectMembers.userId, users.id))
		.where(eq(projectMembers.projectId, projectId))
		.orderBy(projectMembers.role, users.name);

	return {
		project,
		members: memberRows,
		currentUserId: session.userId,
	};
};

export const actions: Actions = {
	updateMemberRole: async ({ request, params }) => {
		const data = await request.formData();
		const userId = data.get("userId") as UserId;
		const newRole = data.get("role") as string;

		if (!userId || !newRole) {
			return fail(400, { error: "User ID and role are required" });
		}

		if (!ProjectMemberRole.options.includes(newRole as any)) {
			return fail(400, { error: `Invalid role: ${newRole}` });
		}

		await db
			.update(projectMembers)
			.set({ role: newRole as any })
			.where(
				and(
					eq(projectMembers.projectId, params.projectId),
					eq(projectMembers.userId, userId),
				),
			);

		return { updateSuccess: true };
	},

	removeMember: async ({ request, params }) => {
		const data = await request.formData();
		const userId = data.get("userId") as UserId;

		if (!userId) {
			return fail(400, { error: "User ID is required" });
		}

		// Don't allow removing the last admin
		const [adminCountResult] = await db
			.select({ count: sql<number>`count(*)` })
			.from(projectMembers)
			.where(
				and(
					eq(projectMembers.projectId, params.projectId),
					eq(projectMembers.role, "admin"),
				),
			);

		const [targetMember] = await db
			.select({ role: projectMembers.role })
			.from(projectMembers)
			.where(
				and(
					eq(projectMembers.projectId, params.projectId),
					eq(projectMembers.userId, userId),
				),
			);

		const targetRole = targetMember?.role;
		const remainingAdmins = Number(adminCountResult?.count ?? 0);

		if (targetRole === "admin" && remainingAdmins <= 1) {
			return fail(400, {
				error: "Cannot remove the last admin. Promote another member to admin first.",
			});
		}

		await db
			.delete(projectMembers)
			.where(
				and(
					eq(projectMembers.projectId, params.projectId),
					eq(projectMembers.userId, userId),
				),
			);

		return { removeSuccess: true };
	},

	deleteProject: async ({ params }) => {
		// Cascade: delete members first, then project
		await db.transaction(async (tx) => {
			await tx
				.delete(projectMembers)
				.where(eq(projectMembers.projectId, params.projectId));

			await tx
				.delete(projects)
				.where(eq(projects.id, params.projectId));
		});

		return { deleted: true };
	},

	updateProjectName: async ({ request, params }) => {
		const data = await request.formData();
		const name = (data.get("name") as string || "").trim();

		if (!name) {
			return fail(400, { error: "Project name is required" });
		}

		await db
			.update(projects)
			.set({ name })
			.where(eq(projects.id, params.projectId));

		return { nameSuccess: true };
	},
};
