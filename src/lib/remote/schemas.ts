import * as v from "valibot";

export const CreateUserSchema = v.pipe(
  v.object({
    inviteCode: v.string(),
    name: v.string(),
    _password: v.string(),
    _confirm: v.string(),
  }),
  v.rawCheck(({ dataset, addIssue }) => {
    if (dataset.typed) {
      if (dataset.value._password !== dataset.value._confirm) {
        addIssue({
          message: "Passwords do not match",
          path: [
            {
              type: "object",
              origin: "value",
              input: dataset.value,
              key: "_confirm",
              value: "[REDACTED]",
            },
          ],
        });
      }
    }
  }),
);
