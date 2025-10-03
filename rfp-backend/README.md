## Get started

1. npm install

2. docker-compose up

- To-clean postgres volume and delete db data 

1. docker-compose down -v

2. Edit 001_init.sql with your schema changes.

3. docker-compose up --build

## Database migration
1. Create a new migration file instead of editing the old one:

- db/init/migrations/002_add_new_table.sql

Example:

ALTER TABLE documents ADD COLUMN description text;
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE
);


Run it manually:

- docker-compose exec db psql -U rfpuser -d rfpdb -f /docker-entrypoint-initdb.d/migrations/002_add_new_table.sql


Or run all pending migrations with your script:

- ./scripts/migrate.sh


(It loops over db/init/migrations/*.sql and applies them.)


- Flow in your project right now

Bootstrap (first run):
-> Docker builds Postgres image → runs 001_init.sql → DB schema created → ready for app.

Later schema changes:

If you edit 001_init.sql → nothing happens (Postgres won’t re-run it unless DB volume deleted).

Correct way: create a new 00X_change.sql, then run it manually (psql or migrate.sh).

Dockerfile config:
Your db/Dockerfile just installs pgvector, then copies everything in db/init/ into /docker-entrypoint-initdb.d/.
That means only “init once” behavior is wired in.
You (developer) must run migrations manually afterwards.