# harrsoft-kanban

A work planner.

## Licensing

This software is licensed under the terms of the AGPL 3.0 license. If you find
that doesn't serve your needs, please contact us at <sales@harrsoft.studio> to
negotiate an exception.

## Package Scripts

This package was developed primarily with bun as its runtime and package
manager. If you run into issues executing these scripts, try using the command
`$ bun -b run <script>`, which will correctly resolve aliases.

## Env Variables

Make sure to have the following variables set:

    ORIGIN="http://localhost:5173" # optional in dev mode, required in builds
    AUTH_SECRET="this can be anything"
    DATABASE_URL="postgres://..."
