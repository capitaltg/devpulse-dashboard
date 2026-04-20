-- public.commit_comments definition

-- Drop table

-- DROP TABLE public.commit_comments;

CREATE TABLE public.commit_comments (
	id int8 NOT NULL,
	commit_id varchar(40) NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	author varchar(255) NOT NULL,
	author_id int8 NULL,
	body text NOT NULL,
	"path" varchar(500) NULL,
	"position" int4 NULL,
	line int4 NULL,
	html_url varchar(500) NULL,
	commit_url varchar(500) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	reactions_total int4 DEFAULT 0 NULL,
	reactions_plus_one int4 DEFAULT 0 NULL,
	reactions_minus_one int4 DEFAULT 0 NULL,
	reactions_laugh int4 DEFAULT 0 NULL,
	reactions_hooray int4 DEFAULT 0 NULL,
	reactions_confused int4 DEFAULT 0 NULL,
	reactions_heart int4 DEFAULT 0 NULL,
	reactions_rocket int4 DEFAULT 0 NULL,
	reactions_eyes int4 DEFAULT 0 NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT commit_comments_pkey PRIMARY KEY (id),
	CONSTRAINT unique_workspace_commit_comment UNIQUE (workspace_id, id)
);
CREATE INDEX idx_commit_comments_author ON public.commit_comments USING btree (author);
CREATE INDEX idx_commit_comments_commit_id ON public.commit_comments USING btree (commit_id);
CREATE INDEX idx_commit_comments_created_at ON public.commit_comments USING btree (created_at);
CREATE INDEX idx_commit_comments_path ON public.commit_comments USING btree (path);
CREATE INDEX idx_commit_comments_processed_at ON public.commit_comments USING btree (processed_at);
CREATE INDEX idx_commit_comments_repository_full_name ON public.commit_comments USING btree (repository_full_name);
CREATE INDEX idx_commit_comments_repository_id ON public.commit_comments USING btree (repository_id);
CREATE INDEX idx_commit_comments_updated_at ON public.commit_comments USING btree (updated_at);


-- public.commits definition

-- Drop table

-- DROP TABLE public.commits;

CREATE TABLE public.commits (
	sha varchar(40) NOT NULL,
	repository_id int8 NULL,
	repository_owner varchar(255) NOT NULL,
	repository_name varchar(255) NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	message text NOT NULL,
	author_date timestamp NULL,
	author_email varchar(255) NULL,
	committer_date timestamp NULL,
	committer_email varchar(255) NULL,
	author_login varchar(255) NULL,
	author_id int8 NULL,
	committer_login varchar(255) NULL,
	committer_id int8 NULL,
	comment_count int4 DEFAULT 0 NULL,
	total_changes int4 NULL,
	additions int4 NULL,
	deletions int4 NULL,
	verified bool DEFAULT false NULL,
	verification_reason varchar(100) NULL,
	verified_at timestamp NULL,
	processed_at timestamp DEFAULT now() NULL,
	last_updated timestamp DEFAULT now() NULL,
	commit_type varchar(20) NOT NULL,
	CONSTRAINT check_commit_type CHECK (((commit_type)::text = ANY ((ARRAY['initial'::character varying, 'standard'::character varying, 'merge'::character varying])::text[]))),
	CONSTRAINT commits_pkey PRIMARY KEY (sha)
);
CREATE INDEX idx_commits_author_date ON public.commits USING btree (author_date);
CREATE INDEX idx_commits_author_login ON public.commits USING btree (author_login);
CREATE INDEX idx_commits_commit_type ON public.commits USING btree (commit_type);
CREATE INDEX idx_commits_committer_date ON public.commits USING btree (committer_date);
CREATE INDEX idx_commits_committer_login ON public.commits USING btree (committer_login);
CREATE INDEX idx_commits_repository_id ON public.commits USING btree (repository_id);
CREATE INDEX idx_commits_repo_full_name ON public.commits USING btree (repository_full_name);
CREATE INDEX idx_commits_repository_name ON public.commits USING btree (repository_name);
CREATE INDEX idx_commits_repository_owner ON public.commits USING btree (repository_owner);


-- public.internal_users definition

-- Drop table

-- DROP TABLE public.internal_users;

CREATE TABLE public.internal_users (
	id serial4 NOT NULL,
	sub uuid NOT NULL,
	username varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	display_name varchar(255) NULL,
	is_active bool DEFAULT true NULL,
	is_admin bool DEFAULT false NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	last_login_at timestamp NULL,
	CONSTRAINT internal_users_email_key UNIQUE (email),
	CONSTRAINT internal_users_pkey PRIMARY KEY (id),
	CONSTRAINT internal_users_sub_key UNIQUE (sub),
	CONSTRAINT internal_users_username_key UNIQUE (username)
);
CREATE INDEX idx_internal_users_email ON public.internal_users USING btree (email);
CREATE INDEX idx_internal_users_is_active ON public.internal_users USING btree (is_active);
CREATE INDEX idx_internal_users_username ON public.internal_users USING btree (username);


-- public.issue_comments definition

-- Drop table

-- DROP TABLE public.issue_comments;

CREATE TABLE public.issue_comments (
	id int8 NOT NULL,
	issue_id int8 NOT NULL,
	issue_number int4 NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	author varchar(255) NOT NULL,
	author_id int8 NULL,
	body text NOT NULL,
	html_url varchar(500) NULL,
	issue_url varchar(500) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	reactions_total int4 DEFAULT 0 NULL,
	reactions_plus_one int4 DEFAULT 0 NULL,
	reactions_minus_one int4 DEFAULT 0 NULL,
	reactions_laugh int4 DEFAULT 0 NULL,
	reactions_hooray int4 DEFAULT 0 NULL,
	reactions_confused int4 DEFAULT 0 NULL,
	reactions_heart int4 DEFAULT 0 NULL,
	reactions_rocket int4 DEFAULT 0 NULL,
	reactions_eyes int4 DEFAULT 0 NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT issue_comments_pkey PRIMARY KEY (id),
	CONSTRAINT unique_workspace_issue_comment UNIQUE (workspace_id, id)
);
CREATE INDEX idx_issue_comments_author ON public.issue_comments USING btree (author);
CREATE INDEX idx_issue_comments_created_at ON public.issue_comments USING btree (created_at);
CREATE INDEX idx_issue_comments_issue_id ON public.issue_comments USING btree (issue_id);
CREATE INDEX idx_issue_comments_issue_number ON public.issue_comments USING btree (repository_id, issue_number);
CREATE INDEX idx_issue_comments_processed_at ON public.issue_comments USING btree (processed_at);
CREATE INDEX idx_issue_comments_repository_full_name ON public.issue_comments USING btree (repository_full_name);
CREATE INDEX idx_issue_comments_repository_id ON public.issue_comments USING btree (repository_id);
CREATE INDEX idx_issue_comments_updated_at ON public.issue_comments USING btree (updated_at);


-- public.issues definition

-- Drop table

-- DROP TABLE public.issues;

CREATE TABLE public.issues (
	id int8 NOT NULL,
	"number" int4 NOT NULL,
	state varchar(20) NOT NULL,
	title text NOT NULL,
	body text NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	author varchar(255) NOT NULL,
	author_id int8 NULL,
	html_url varchar(500) NULL,
	comments_url varchar(500) NULL,
	events_url varchar(500) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	closed_at timestamp NULL,
	assignees _text NULL,
	labels _text NULL,
	milestone_id int8 NULL,
	milestone_title varchar(255) NULL,
	state_reason varchar(50) NULL,
	"locked" bool DEFAULT false NULL,
	active_lock_reason varchar(50) NULL,
	closed_by varchar(255) NULL,
	closed_by_id int8 NULL,
	"comments" int4 DEFAULT 0 NULL,
	reactions_total int4 DEFAULT 0 NULL,
	reactions_plus_one int4 DEFAULT 0 NULL,
	reactions_minus_one int4 DEFAULT 0 NULL,
	reactions_laugh int4 DEFAULT 0 NULL,
	reactions_hooray int4 DEFAULT 0 NULL,
	reactions_confused int4 DEFAULT 0 NULL,
	reactions_heart int4 DEFAULT 0 NULL,
	reactions_rocket int4 DEFAULT 0 NULL,
	reactions_eyes int4 DEFAULT 0 NULL,
	is_pull_request bool DEFAULT false NULL,
	pull_request_url varchar(500) NULL,
	type_name varchar(255) NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT issues_pkey PRIMARY KEY (id),
	CONSTRAINT unique_workspace_issue UNIQUE (workspace_id, id)
);
CREATE INDEX idx_issues_assignees ON public.issues USING gin (assignees);
CREATE INDEX idx_issues_author ON public.issues USING btree (author);
CREATE INDEX idx_issues_closed_at ON public.issues USING btree (closed_at);
CREATE INDEX idx_issues_created_at ON public.issues USING btree (created_at);
CREATE INDEX idx_issues_is_pull_request ON public.issues USING btree (is_pull_request) WHERE (is_pull_request = true);
CREATE INDEX idx_issues_labels ON public.issues USING gin (labels);
CREATE INDEX idx_issues_number_repo ON public.issues USING btree (repository_id, number);
CREATE INDEX idx_issues_processed_at ON public.issues USING btree (processed_at);
CREATE INDEX idx_issues_repository_full_name ON public.issues USING btree (repository_full_name);
CREATE INDEX idx_issues_repository_id ON public.issues USING btree (repository_id);
CREATE INDEX idx_issues_state ON public.issues USING btree (state);
CREATE INDEX idx_issues_updated_at ON public.issues USING btree (updated_at);


-- public.pull_request_review_comments definition

-- Drop table

-- DROP TABLE public.pull_request_review_comments;

CREATE TABLE public.pull_request_review_comments (
	id int8 NOT NULL,
	pull_request_id int8 NOT NULL,
	pull_request_number int4 NOT NULL,
	pull_request_review_id int8 NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	author varchar(255) NOT NULL,
	author_id int8 NULL,
	body text NOT NULL,
	"path" varchar(500) NULL,
	"position" int4 NULL,
	original_position int4 NULL,
	line int4 NULL,
	original_line int4 NULL,
	side varchar(10) NULL,
	start_line int4 NULL,
	start_side varchar(10) NULL,
	commit_id varchar(40) NULL,
	original_commit_id varchar(40) NULL,
	diff_hunk text NULL,
	in_reply_to_id int8 NULL,
	html_url varchar(500) NULL,
	pull_request_url varchar(500) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int8 NOT NULL,
	CONSTRAINT pull_request_review_comments_pkey PRIMARY KEY (id),
	CONSTRAINT unique_pr_review_comment_workspace UNIQUE (repository_id, pull_request_number, id, workspace_id)
);
CREATE INDEX idx_pr_review_comments_author ON public.pull_request_review_comments USING btree (author);
CREATE INDEX idx_pr_review_comments_commit_id ON public.pull_request_review_comments USING btree (commit_id);
CREATE INDEX idx_pr_review_comments_created_at ON public.pull_request_review_comments USING btree (created_at);
CREATE INDEX idx_pr_review_comments_in_reply_to ON public.pull_request_review_comments USING btree (in_reply_to_id);
CREATE INDEX idx_pr_review_comments_path ON public.pull_request_review_comments USING btree (path);
CREATE INDEX idx_pr_review_comments_pr_number ON public.pull_request_review_comments USING btree (repository_id, pull_request_number);
CREATE INDEX idx_pr_review_comments_processed_at ON public.pull_request_review_comments USING btree (processed_at);
CREATE INDEX idx_pr_review_comments_pull_request_id ON public.pull_request_review_comments USING btree (pull_request_id);
CREATE INDEX idx_pr_review_comments_repository_full_name ON public.pull_request_review_comments USING btree (repository_full_name);
CREATE INDEX idx_pr_review_comments_repository_id ON public.pull_request_review_comments USING btree (repository_id);
CREATE INDEX idx_pr_review_comments_review_id ON public.pull_request_review_comments USING btree (pull_request_review_id);
CREATE INDEX idx_pr_review_comments_updated_at ON public.pull_request_review_comments USING btree (updated_at);


-- public.pull_request_reviews definition

-- Drop table

-- DROP TABLE public.pull_request_reviews;

CREATE TABLE public.pull_request_reviews (
	id int8 NOT NULL,
	pull_request_id int8 NOT NULL,
	pull_request_number int4 NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	reviewer varchar(255) NOT NULL,
	reviewer_id int8 NULL,
	state varchar(50) NOT NULL,
	body text NULL,
	html_url varchar(500) NULL,
	pull_request_url varchar(500) NULL,
	commit_id varchar(40) NULL,
	submitted_at timestamp NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int8 NOT NULL,
	CONSTRAINT pull_request_reviews_pkey PRIMARY KEY (id),
	CONSTRAINT unique_pr_review_workspace UNIQUE (repository_id, pull_request_number, id, workspace_id)
);
CREATE INDEX idx_pr_reviews_pr_number ON public.pull_request_reviews USING btree (repository_id, pull_request_number);
CREATE INDEX idx_pr_reviews_processed_at ON public.pull_request_reviews USING btree (processed_at);
CREATE INDEX idx_pr_reviews_pull_request_id ON public.pull_request_reviews USING btree (pull_request_id);
CREATE INDEX idx_pr_reviews_repository_full_name ON public.pull_request_reviews USING btree (repository_full_name);
CREATE INDEX idx_pr_reviews_repository_id ON public.pull_request_reviews USING btree (repository_id);
CREATE INDEX idx_pr_reviews_reviewer ON public.pull_request_reviews USING btree (reviewer);
CREATE INDEX idx_pr_reviews_state ON public.pull_request_reviews USING btree (state);
CREATE INDEX idx_pr_reviews_submitted_at ON public.pull_request_reviews USING btree (submitted_at);


-- public.pull_requests definition

-- Drop table

-- DROP TABLE public.pull_requests;

CREATE TABLE public.pull_requests (
	id int8 NOT NULL,
	"number" int4 NOT NULL,
	state varchar(20) NOT NULL,
	title text NOT NULL,
	body text NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	author varchar(255) NOT NULL,
	author_id int8 NULL,
	head_ref varchar(255) NULL,
	head_sha varchar(40) NULL,
	base_ref varchar(255) NULL,
	base_sha varchar(40) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	closed_at timestamp NULL,
	merged_at timestamp NULL,
	draft bool DEFAULT false NULL,
	merged bool DEFAULT false NULL,
	mergeable bool NULL,
	rebaseable bool NULL,
	mergeable_state varchar(50) NULL,
	merged_by varchar(255) NULL,
	merge_commit_sha varchar(40) NULL,
	"comments" int4 DEFAULT 0 NULL,
	review_comments int4 DEFAULT 0 NULL,
	commits int4 DEFAULT 0 NULL,
	additions int4 DEFAULT 0 NULL,
	deletions int4 DEFAULT 0 NULL,
	changed_files int4 DEFAULT 0 NULL,
	labels _text NULL,
	assignees _text NULL,
	requested_reviewers _text NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int8 NOT NULL,
	CONSTRAINT pull_requests_pkey PRIMARY KEY (id),
	CONSTRAINT unique_pull_request_workspace UNIQUE (repository_id, number, workspace_id)
);
CREATE INDEX idx_pull_requests_author ON public.pull_requests USING btree (author);
CREATE INDEX idx_pull_requests_created_at ON public.pull_requests USING btree (created_at);
CREATE INDEX idx_pull_requests_merged ON public.pull_requests USING btree (merged);
CREATE INDEX idx_pull_requests_number_repo ON public.pull_requests USING btree (repository_id, number);
CREATE INDEX idx_pull_requests_processed_at ON public.pull_requests USING btree (processed_at);
CREATE INDEX idx_pull_requests_repository_full_name ON public.pull_requests USING btree (repository_full_name);
CREATE INDEX idx_pull_requests_repository_id ON public.pull_requests USING btree (repository_id);
CREATE INDEX idx_pull_requests_state ON public.pull_requests USING btree (state);
CREATE INDEX idx_pull_requests_updated_at ON public.pull_requests USING btree (updated_at);


-- public.pushes definition

-- Drop table

-- DROP TABLE public.pushes;

CREATE TABLE public.pushes (
	id serial4 NOT NULL,
	push_id varchar(255) NULL,
	"ref" varchar(255) NOT NULL,
	before_sha varchar(40) NOT NULL,
	after_sha varchar(40) NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	pusher varchar(255) NOT NULL,
	pusher_email varchar(255) NULL,
	sender varchar(255) NULL,
	sender_id int8 NULL,
	branch_name varchar(255) NULL,
	is_default_branch bool DEFAULT false NULL,
	created bool DEFAULT false NULL,
	deleted bool DEFAULT false NULL,
	forced bool DEFAULT false NULL,
	commit_count int4 DEFAULT 0 NULL,
	distinct_commit_count int4 DEFAULT 0 NULL,
	head_commit_id varchar(40) NULL,
	head_commit_message text NULL,
	head_commit_timestamp timestamp NULL,
	head_commit_author varchar(255) NULL,
	head_commit_author_email varchar(255) NULL,
	head_commit_committer varchar(255) NULL,
	head_commit_committer_email varchar(255) NULL,
	head_commit_url varchar(500) NULL,
	commit_ids _text NULL,
	commit_messages _text NULL,
	compare_url varchar(500) NULL,
	pushed_at timestamp NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT pushes_pkey PRIMARY KEY (id),
	CONSTRAINT unique_workspace_push UNIQUE (workspace_id, push_id)
);
CREATE INDEX idx_pushes_after_sha ON public.pushes USING btree (after_sha);
CREATE INDEX idx_pushes_branch_name ON public.pushes USING btree (branch_name);
CREATE INDEX idx_pushes_default_branch ON public.pushes USING btree (is_default_branch) WHERE (is_default_branch = true);
CREATE INDEX idx_pushes_forced ON public.pushes USING btree (forced) WHERE (forced = true);
CREATE INDEX idx_pushes_processed_at ON public.pushes USING btree (processed_at);
CREATE INDEX idx_pushes_pushed_at ON public.pushes USING btree (pushed_at);
CREATE INDEX idx_pushes_pusher ON public.pushes USING btree (pusher);
CREATE INDEX idx_pushes_ref ON public.pushes USING btree (ref);
CREATE INDEX idx_pushes_repository_full_name ON public.pushes USING btree (repository_full_name);
CREATE INDEX idx_pushes_repository_id ON public.pushes USING btree (repository_id);


-- public.repositories definition

-- Drop table

-- DROP TABLE public.repositories;

CREATE TABLE public.repositories (
	id int8 NOT NULL,
	"name" varchar(255) NOT NULL,
	full_name varchar(255) NOT NULL,
	"owner" varchar(255) NOT NULL,
	description text NULL,
	private bool DEFAULT false NULL,
	html_url varchar(500) NULL,
	default_branch varchar(255) DEFAULT 'main'::character varying NULL,
	"language" varchar(100) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	pushed_at timestamp NULL,
	stargazers_count int4 DEFAULT 0 NULL,
	watchers_count int4 DEFAULT 0 NULL,
	forks_count int4 DEFAULT 0 NULL,
	open_issues_count int4 DEFAULT 0 NULL,
	"size" int4 DEFAULT 0 NULL,
	has_issues bool DEFAULT false NULL,
	has_projects bool DEFAULT false NULL,
	has_wiki bool DEFAULT false NULL,
	has_pages bool DEFAULT false NULL,
	has_downloads bool DEFAULT false NULL,
	archived bool DEFAULT false NULL,
	disabled bool DEFAULT false NULL,
	fork bool DEFAULT false NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int8 NOT NULL,
	CONSTRAINT repositories_pkey PRIMARY KEY (id),
	CONSTRAINT unique_repository_workspace UNIQUE (id, workspace_id)
);
CREATE INDEX idx_repositories_created_at ON public.repositories USING btree (created_at);
CREATE INDEX idx_repositories_full_name ON public.repositories USING btree (full_name);
CREATE INDEX idx_repositories_owner ON public.repositories USING btree (owner);
CREATE INDEX idx_repositories_processed_at ON public.repositories USING btree (processed_at);

ALTER TABLE public.commits
	ADD CONSTRAINT fk_commits_repository_id
	FOREIGN KEY (repository_id)
	REFERENCES public.repositories(id)
	ON DELETE SET NULL;


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id int8 NOT NULL,
	login varchar(255) NOT NULL,
	node_id varchar(255) NULL,
	"type" varchar(50) DEFAULT 'User'::character varying NULL,
	site_admin bool DEFAULT false NULL,
	"name" varchar(255) NULL,
	email varchar(255) NULL,
	company varchar(255) NULL,
	blog varchar(500) NULL,
	"location" varchar(255) NULL,
	bio text NULL,
	twitter_username varchar(255) NULL,
	avatar_url varchar(500) NULL,
	gravatar_id varchar(255) NULL,
	public_repos int4 DEFAULT 0 NULL,
	public_gists int4 DEFAULT 0 NULL,
	followers int4 DEFAULT 0 NULL,
	"following" int4 DEFAULT 0 NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	hireable bool NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	import_source varchar(50) NULL,
	processed_at timestamp DEFAULT now() NULL,
	CONSTRAINT users_login_key UNIQUE (login),
	CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_import_source ON public.users USING btree (import_source);
CREATE INDEX idx_users_login ON public.users USING btree (login);
CREATE INDEX idx_users_type ON public.users USING btree (type);


-- public.commit_files definition

-- Drop table

-- DROP TABLE public.commit_files;

CREATE TABLE public.commit_files (
	id serial4 NOT NULL,
	commit_sha varchar(40) NOT NULL,
	filename varchar(1000) NOT NULL,
	previous_filename varchar(1000) NULL,
	status varchar(20) NOT NULL,
	additions int4 DEFAULT 0 NULL,
	deletions int4 DEFAULT 0 NULL,
	changes int4 DEFAULT 0 NULL,
	sha varchar(40) NULL,
	patch text NULL,
	CONSTRAINT commit_files_pkey PRIMARY KEY (id),
	CONSTRAINT unique_commit_filename UNIQUE (commit_sha, filename),
	CONSTRAINT commit_files_commit_sha_fkey FOREIGN KEY (commit_sha) REFERENCES public.commits(sha) ON DELETE CASCADE
);
CREATE INDEX idx_commit_files_commit ON public.commit_files USING btree (commit_sha);
CREATE INDEX idx_commit_files_filename ON public.commit_files USING btree (filename);
CREATE INDEX idx_commit_files_status ON public.commit_files USING btree (status);


-- public.workspace_members definition

-- Drop table

-- DROP TABLE public.workspace_members;

CREATE TABLE public.workspace_members (
	workspace_id int4 NOT NULL,
	user_id int4 NOT NULL,
	relationship varchar(50) NOT NULL,
	added_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workspace_members_pkey PRIMARY KEY (workspace_id, user_id),
	CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.internal_users(id) ON DELETE CASCADE
);
CREATE INDEX idx_workspace_members_relationship ON public.workspace_members USING btree (relationship);
CREATE INDEX idx_workspace_members_user_id ON public.workspace_members USING btree (user_id);
CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members USING btree (workspace_id);


-- public.workspaces definition

-- Drop table

-- DROP TABLE public.workspaces;

CREATE TABLE public.workspaces (
	id serial4 NOT NULL,
	external_id varchar(255) NOT NULL,
	description varchar(255) NULL,
	creator_id int4 NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workspaces_external_id_key UNIQUE (external_id),
	CONSTRAINT workspaces_pkey PRIMARY KEY (id),
	CONSTRAINT workspaces_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.internal_users(id) ON DELETE RESTRICT
);
CREATE INDEX idx_workspaces_created_at ON public.workspaces USING btree (created_at);
CREATE INDEX idx_workspaces_creator_id ON public.workspaces USING btree (creator_id);
CREATE INDEX idx_workspaces_external_id ON public.workspaces USING btree (external_id);


-- public.branches definition

-- Drop table

-- DROP TABLE public.branches;

CREATE TABLE public.branches (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	status varchar(20) DEFAULT 'active'::character varying NOT NULL,
	commit_sha varchar(40) NULL,
	created_at timestamp NULL,
	created_by varchar(255) NULL,
	created_by_email varchar(255) NULL,
	created_by_id int8 NULL,
	deleted_at timestamp NULL,
	deleted_by varchar(255) NULL,
	deleted_by_email varchar(255) NULL,
	deleted_by_id int8 NULL,
	updated_at timestamp DEFAULT now() NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT branches_pkey PRIMARY KEY (id),
	CONSTRAINT unique_branch UNIQUE (workspace_id, repository_id, name),
	CONSTRAINT fk_branches_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_branches_commit_sha ON public.branches USING btree (commit_sha);
CREATE INDEX idx_branches_created_at ON public.branches USING btree (created_at);
CREATE INDEX idx_branches_created_by ON public.branches USING btree (created_by);
CREATE INDEX idx_branches_deleted_at ON public.branches USING btree (deleted_at);
CREATE INDEX idx_branches_deleted_by ON public.branches USING btree (deleted_by);
CREATE INDEX idx_branches_name ON public.branches USING btree (name);
CREATE INDEX idx_branches_repository_full_name ON public.branches USING btree (repository_full_name);
CREATE INDEX idx_branches_repository_id ON public.branches USING btree (repository_id);
CREATE INDEX idx_branches_status ON public.branches USING btree (status);
CREATE INDEX idx_branches_workspace_id ON public.branches USING btree (workspace_id);


-- public.check_runs definition

-- Drop table

-- DROP TABLE public.check_runs;

CREATE TABLE public.check_runs (
	id int8 NOT NULL,
	"name" varchar(255) NOT NULL,
	check_suite_id int8 NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	head_sha varchar(40) NOT NULL,
	head_branch varchar(255) NULL,
	status varchar(50) NOT NULL,
	conclusion varchar(50) NULL,
	started_at timestamp NULL,
	completed_at timestamp NULL,
	details_url varchar(500) NULL,
	html_url varchar(500) NULL,
	external_id varchar(255) NULL,
	app_id int8 NULL,
	app_name varchar(255) NULL,
	app_slug varchar(255) NULL,
	output_title text NULL,
	output_summary text NULL,
	output_text text NULL,
	annotations_count int4 DEFAULT 0 NULL,
	pull_request_numbers _int4 NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT check_runs_pkey PRIMARY KEY (id),
	CONSTRAINT unique_workspace_check_run UNIQUE (workspace_id, id),
	CONSTRAINT fk_check_runs_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_check_runs_app_name ON public.check_runs USING btree (app_name);
CREATE INDEX idx_check_runs_check_suite_id ON public.check_runs USING btree (check_suite_id);
CREATE INDEX idx_check_runs_completed_at ON public.check_runs USING btree (completed_at);
CREATE INDEX idx_check_runs_conclusion ON public.check_runs USING btree (conclusion);
CREATE INDEX idx_check_runs_head_branch ON public.check_runs USING btree (head_branch);
CREATE INDEX idx_check_runs_head_sha ON public.check_runs USING btree (head_sha);
CREATE INDEX idx_check_runs_name ON public.check_runs USING btree (name);
CREATE INDEX idx_check_runs_processed_at ON public.check_runs USING btree (processed_at);
CREATE INDEX idx_check_runs_pull_requests ON public.check_runs USING gin (pull_request_numbers);
CREATE INDEX idx_check_runs_repository_full_name ON public.check_runs USING btree (repository_full_name);
CREATE INDEX idx_check_runs_repository_id ON public.check_runs USING btree (repository_id);
CREATE INDEX idx_check_runs_started_at ON public.check_runs USING btree (started_at);
CREATE INDEX idx_check_runs_status ON public.check_runs USING btree (status);
CREATE INDEX idx_check_runs_workspace_id ON public.check_runs USING btree (workspace_id);


-- public.check_suites definition

-- Drop table

-- DROP TABLE public.check_suites;

CREATE TABLE public.check_suites (
	id int8 NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	head_sha varchar(40) NOT NULL,
	head_branch varchar(255) NULL,
	status varchar(50) NOT NULL,
	conclusion varchar(50) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	url varchar(500) NULL,
	app_id int8 NULL,
	app_name varchar(255) NULL,
	app_slug varchar(255) NULL,
	before_sha varchar(40) NULL,
	after_sha varchar(40) NULL,
	pull_request_numbers _int4 NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT check_suites_pkey PRIMARY KEY (id),
	CONSTRAINT unique_workspace_check_suite UNIQUE (workspace_id, id),
	CONSTRAINT fk_check_suites_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_check_suites_app_name ON public.check_suites USING btree (app_name);
CREATE INDEX idx_check_suites_conclusion ON public.check_suites USING btree (conclusion);
CREATE INDEX idx_check_suites_created_at ON public.check_suites USING btree (created_at);
CREATE INDEX idx_check_suites_head_branch ON public.check_suites USING btree (head_branch);
CREATE INDEX idx_check_suites_head_sha ON public.check_suites USING btree (head_sha);
CREATE INDEX idx_check_suites_processed_at ON public.check_suites USING btree (processed_at);
CREATE INDEX idx_check_suites_pull_requests ON public.check_suites USING gin (pull_request_numbers);
CREATE INDEX idx_check_suites_repository_full_name ON public.check_suites USING btree (repository_full_name);
CREATE INDEX idx_check_suites_repository_id ON public.check_suites USING btree (repository_id);
CREATE INDEX idx_check_suites_status ON public.check_suites USING btree (status);
CREATE INDEX idx_check_suites_updated_at ON public.check_suites USING btree (updated_at);
CREATE INDEX idx_check_suites_workspace_id ON public.check_suites USING btree (workspace_id);


-- public.organizations definition

-- Drop table

-- DROP TABLE public.organizations;

CREATE TABLE public.organizations (
	id int8 NOT NULL,
	login varchar(255) NOT NULL,
	node_id varchar(255) NULL,
	"name" varchar(255) NULL,
	description text NULL,
	"type" varchar(50) DEFAULT 'Organization'::character varying NULL,
	company varchar(255) NULL,
	blog varchar(500) NULL,
	"location" varchar(255) NULL,
	email varchar(255) NULL,
	twitter_username varchar(255) NULL,
	is_verified bool DEFAULT false NULL,
	avatar_url varchar(500) NULL,
	url varchar(500) NULL,
	html_url varchar(500) NULL,
	repos_url varchar(500) NULL,
	events_url varchar(500) NULL,
	hooks_url varchar(500) NULL,
	issues_url varchar(500) NULL,
	members_url varchar(500) NULL,
	public_members_url varchar(500) NULL,
	has_organization_projects bool DEFAULT true NULL,
	has_repository_projects bool DEFAULT true NULL,
	public_repos int4 DEFAULT 0 NULL,
	public_gists int4 DEFAULT 0 NULL,
	followers int4 DEFAULT 0 NULL,
	"following" int4 DEFAULT 0 NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	archived_at timestamp NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT organizations_pkey PRIMARY KEY (workspace_id, id),
	CONSTRAINT fk_organizations_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_organizations_is_verified ON public.organizations USING btree (is_verified);
CREATE INDEX idx_organizations_login ON public.organizations USING btree (login);
CREATE INDEX idx_organizations_type ON public.organizations USING btree (type);
CREATE INDEX idx_organizations_workspace_id ON public.organizations USING btree (workspace_id);
CREATE INDEX idx_organizations_workspace_login ON public.organizations USING btree (workspace_id, login);


-- public.tags definition

-- Drop table

-- DROP TABLE public.tags;

CREATE TABLE public.tags (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	status varchar(20) DEFAULT 'active'::character varying NOT NULL,
	commit_sha varchar(40) NULL,
	description text NULL,
	created_at timestamp NULL,
	created_by varchar(255) NULL,
	created_by_email varchar(255) NULL,
	created_by_id int8 NULL,
	deleted_at timestamp NULL,
	deleted_by varchar(255) NULL,
	deleted_by_email varchar(255) NULL,
	deleted_by_id int8 NULL,
	updated_at timestamp DEFAULT now() NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT tags_pkey PRIMARY KEY (id),
	CONSTRAINT unique_tag UNIQUE (workspace_id, repository_id, name),
	CONSTRAINT fk_tags_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_tags_commit_sha ON public.tags USING btree (commit_sha);
CREATE INDEX idx_tags_created_at ON public.tags USING btree (created_at);
CREATE INDEX idx_tags_created_by ON public.tags USING btree (created_by);
CREATE INDEX idx_tags_deleted_at ON public.tags USING btree (deleted_at);
CREATE INDEX idx_tags_deleted_by ON public.tags USING btree (deleted_by);
CREATE INDEX idx_tags_name ON public.tags USING btree (name);
CREATE INDEX idx_tags_repository_full_name ON public.tags USING btree (repository_full_name);
CREATE INDEX idx_tags_repository_id ON public.tags USING btree (repository_id);
CREATE INDEX idx_tags_status ON public.tags USING btree (status);
CREATE INDEX idx_tags_workspace_id ON public.tags USING btree (workspace_id);


-- public.teams definition

-- Drop table

-- DROP TABLE public.teams;

CREATE TABLE public.teams (
	id int8 NOT NULL,
	node_id varchar(255) NULL,
	"name" varchar(255) NOT NULL,
	slug varchar(255) NOT NULL,
	description text NULL,
	organization_id int8 NOT NULL,
	privacy varchar(50) NULL,
	notification_setting varchar(50) NULL,
	"permission" varchar(50) NULL,
	url varchar(500) NULL,
	html_url varchar(500) NULL,
	members_url varchar(500) NULL,
	repositories_url varchar(500) NULL,
	parent_id int8 NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	last_event_action varchar(50) NULL,
	last_event_at timestamp NULL,
	synced_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT teams_pkey PRIMARY KEY (id),
	CONSTRAINT unique_workspace_org_slug UNIQUE (workspace_id, organization_id, slug),
	CONSTRAINT unique_workspace_team UNIQUE (workspace_id, id),
	CONSTRAINT teams_organization_fkey FOREIGN KEY (workspace_id,organization_id) REFERENCES public.organizations(workspace_id,id) ON DELETE CASCADE,
	CONSTRAINT teams_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.teams(id) ON DELETE SET NULL
);
CREATE INDEX idx_teams_org_id ON public.teams USING btree (organization_id);
CREATE INDEX idx_teams_parent_id ON public.teams USING btree (parent_id);
CREATE INDEX idx_teams_slug ON public.teams USING btree (slug);
CREATE INDEX idx_teams_synced_at ON public.teams USING btree (synced_at);
CREATE INDEX idx_teams_workspace_id ON public.teams USING btree (workspace_id);


-- public.wiki_pages definition

-- Drop table

-- DROP TABLE public.wiki_pages;

CREATE TABLE public.wiki_pages (
	id serial4 NOT NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	page_name varchar(500) NOT NULL,
	title varchar(500) NULL,
	"action" varchar(20) NOT NULL,
	sha varchar(40) NOT NULL,
	html_url text NULL,
	sender varchar(255) NULL,
	sender_id int8 NULL,
	created_at timestamp NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT wiki_pages_pkey PRIMARY KEY (id),
	CONSTRAINT wiki_pages_workspace_repo_page_sha_key UNIQUE (workspace_id, repository_id, page_name, sha),
	CONSTRAINT wiki_pages_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_wiki_pages_action ON public.wiki_pages USING btree (action);
CREATE INDEX idx_wiki_pages_created_at ON public.wiki_pages USING btree (created_at);
CREATE INDEX idx_wiki_pages_page_name ON public.wiki_pages USING btree (repository_id, page_name);
CREATE INDEX idx_wiki_pages_repo ON public.wiki_pages USING btree (repository_id);
CREATE INDEX idx_wiki_pages_sender ON public.wiki_pages USING btree (sender_id);
CREATE INDEX idx_wiki_pages_workspace_id ON public.wiki_pages USING btree (workspace_id);


-- public.workflow_jobs definition

-- Drop table

-- DROP TABLE public.workflow_jobs;

CREATE TABLE public.workflow_jobs (
	id int8 NOT NULL,
	"name" varchar(255) NOT NULL,
	workflow_name varchar(255) NULL,
	run_id int8 NOT NULL,
	run_attempt int4 DEFAULT 1 NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	head_sha varchar(40) NOT NULL,
	head_branch varchar(255) NULL,
	status varchar(50) NOT NULL,
	conclusion varchar(50) NULL,
	created_at timestamp NULL,
	started_at timestamp NULL,
	completed_at timestamp NULL,
	html_url varchar(500) NULL,
	check_run_url varchar(500) NULL,
	runner_id int8 NULL,
	runner_name varchar(255) NULL,
	runner_group_id int8 NULL,
	runner_group_name varchar(255) NULL,
	labels _text NULL,
	steps_count int4 DEFAULT 0 NULL,
	steps_completed int4 DEFAULT 0 NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT unique_workspace_workflow_job UNIQUE (workspace_id, id),
	CONSTRAINT workflow_jobs_pkey PRIMARY KEY (id),
	CONSTRAINT fk_workflow_jobs_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_workflow_jobs_completed_at ON public.workflow_jobs USING btree (completed_at);
CREATE INDEX idx_workflow_jobs_conclusion ON public.workflow_jobs USING btree (conclusion);
CREATE INDEX idx_workflow_jobs_created_at ON public.workflow_jobs USING btree (created_at);
CREATE INDEX idx_workflow_jobs_head_branch ON public.workflow_jobs USING btree (head_branch);
CREATE INDEX idx_workflow_jobs_head_sha ON public.workflow_jobs USING btree (head_sha);
CREATE INDEX idx_workflow_jobs_labels ON public.workflow_jobs USING gin (labels);
CREATE INDEX idx_workflow_jobs_name ON public.workflow_jobs USING btree (name);
CREATE INDEX idx_workflow_jobs_processed_at ON public.workflow_jobs USING btree (processed_at);
CREATE INDEX idx_workflow_jobs_repository_full_name ON public.workflow_jobs USING btree (repository_full_name);
CREATE INDEX idx_workflow_jobs_repository_id ON public.workflow_jobs USING btree (repository_id);
CREATE INDEX idx_workflow_jobs_run_id ON public.workflow_jobs USING btree (run_id);
CREATE INDEX idx_workflow_jobs_runner_name ON public.workflow_jobs USING btree (runner_name);
CREATE INDEX idx_workflow_jobs_started_at ON public.workflow_jobs USING btree (started_at);
CREATE INDEX idx_workflow_jobs_status ON public.workflow_jobs USING btree (status);
CREATE INDEX idx_workflow_jobs_workflow_name ON public.workflow_jobs USING btree (workflow_name);
CREATE INDEX idx_workflow_jobs_workspace_id ON public.workflow_jobs USING btree (workspace_id);


-- public.workflow_runs definition

-- Drop table

-- DROP TABLE public.workflow_runs;

CREATE TABLE public.workflow_runs (
	id int8 NOT NULL,
	"name" varchar(255) NOT NULL,
	workflow_id int8 NOT NULL,
	workflow_path varchar(500) NULL,
	repository_id int8 NOT NULL,
	repository_full_name varchar(255) NOT NULL,
	head_sha varchar(40) NOT NULL,
	head_branch varchar(255) NULL,
	head_commit_message text NULL,
	"event" varchar(100) NOT NULL,
	status varchar(50) NOT NULL,
	conclusion varchar(50) NULL,
	run_number int4 NOT NULL,
	run_attempt int4 DEFAULT 1 NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	run_started_at timestamp NULL,
	html_url varchar(500) NULL,
	jobs_url varchar(500) NULL,
	logs_url varchar(500) NULL,
	check_suite_url varchar(500) NULL,
	artifacts_url varchar(500) NULL,
	cancel_url varchar(500) NULL,
	rerun_url varchar(500) NULL,
	workflow_url varchar(500) NULL,
	triggering_actor_login varchar(255) NULL,
	triggering_actor_id int8 NULL,
	pull_request_numbers _int4 NULL,
	previous_attempt_url varchar(500) NULL,
	last_event_action varchar(50) NULL,
	last_event_sender varchar(255) NULL,
	processed_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT unique_workspace_workflow_run UNIQUE (workspace_id, id),
	CONSTRAINT workflow_runs_pkey PRIMARY KEY (id),
	CONSTRAINT fk_workflow_runs_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_workflow_runs_conclusion ON public.workflow_runs USING btree (conclusion);
CREATE INDEX idx_workflow_runs_created_at ON public.workflow_runs USING btree (created_at);
CREATE INDEX idx_workflow_runs_event ON public.workflow_runs USING btree (event);
CREATE INDEX idx_workflow_runs_head_branch ON public.workflow_runs USING btree (head_branch);
CREATE INDEX idx_workflow_runs_head_sha ON public.workflow_runs USING btree (head_sha);
CREATE INDEX idx_workflow_runs_name ON public.workflow_runs USING btree (name);
CREATE INDEX idx_workflow_runs_processed_at ON public.workflow_runs USING btree (processed_at);
CREATE INDEX idx_workflow_runs_pull_requests ON public.workflow_runs USING gin (pull_request_numbers);
CREATE INDEX idx_workflow_runs_repository_full_name ON public.workflow_runs USING btree (repository_full_name);
CREATE INDEX idx_workflow_runs_repository_id ON public.workflow_runs USING btree (repository_id);
CREATE INDEX idx_workflow_runs_run_number ON public.workflow_runs USING btree (run_number);
CREATE INDEX idx_workflow_runs_run_started_at ON public.workflow_runs USING btree (run_started_at);
CREATE INDEX idx_workflow_runs_status ON public.workflow_runs USING btree (status);
CREATE INDEX idx_workflow_runs_triggering_actor ON public.workflow_runs USING btree (triggering_actor_login);
CREATE INDEX idx_workflow_runs_workflow_id ON public.workflow_runs USING btree (workflow_id);
CREATE INDEX idx_workflow_runs_workspace_id ON public.workflow_runs USING btree (workspace_id);


-- public.workspace_organizations definition

-- Drop table

-- DROP TABLE public.workspace_organizations;

CREATE TABLE public.workspace_organizations (
	workspace_id int4 NOT NULL,
	organization_id int8 NOT NULL,
	added_at timestamp DEFAULT now() NULL,
	added_by int4 NULL,
	CONSTRAINT workspace_organizations_pkey PRIMARY KEY (workspace_id, organization_id),
	CONSTRAINT workspace_organizations_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.internal_users(id) ON DELETE SET NULL,
	CONSTRAINT workspace_organizations_organization_fkey FOREIGN KEY (workspace_id,organization_id) REFERENCES public.organizations(workspace_id,id) ON DELETE CASCADE,
	CONSTRAINT workspace_organizations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_workspace_organizations_added_at ON public.workspace_organizations USING btree (added_at);
CREATE INDEX idx_workspace_organizations_organization_id ON public.workspace_organizations USING btree (organization_id);
CREATE INDEX idx_workspace_organizations_workspace_id ON public.workspace_organizations USING btree (workspace_id);


-- public.workspace_tokens definition

-- Drop table

-- DROP TABLE public.workspace_tokens;

CREATE TABLE public.workspace_tokens (
	id serial4 NOT NULL,
	workspace_id int4 NOT NULL,
	secret varchar(255) NOT NULL,
	description varchar(255) NULL,
	created_at timestamp DEFAULT now() NULL,
	created_by int4 NULL,
	last_used_at timestamp NULL,
	is_active bool DEFAULT true NULL,
	revoked_at timestamp NULL,
	revoked_by int4 NULL,
	CONSTRAINT workspace_tokens_pkey PRIMARY KEY (id),
	CONSTRAINT workspace_tokens_secret_key UNIQUE (secret),
	CONSTRAINT workspace_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.internal_users(id) ON DELETE SET NULL,
	CONSTRAINT workspace_tokens_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.internal_users(id) ON DELETE SET NULL,
	CONSTRAINT workspace_tokens_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_workspace_tokens_is_active ON public.workspace_tokens USING btree (is_active);
CREATE INDEX idx_workspace_tokens_secret ON public.workspace_tokens USING btree (secret);
CREATE INDEX idx_workspace_tokens_workspace_id ON public.workspace_tokens USING btree (workspace_id);


-- public.organization_members definition

-- Drop table

-- DROP TABLE public.organization_members;

CREATE TABLE public.organization_members (
	organization_id int8 NOT NULL,
	user_id int8 NOT NULL,
	synced_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT organization_members_pkey PRIMARY KEY (organization_id, user_id),
	CONSTRAINT organization_members_organization_fkey FOREIGN KEY (workspace_id,organization_id) REFERENCES public.organizations(workspace_id,id) ON DELETE CASCADE,
	CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_org_members_org_id ON public.organization_members USING btree (organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members USING btree (user_id);


-- public.organization_tokens definition

-- Drop table

-- DROP TABLE public.organization_tokens;

CREATE TABLE public.organization_tokens (
	id serial4 NOT NULL,
	workspace_id int4 NOT NULL,
	organization_id int8 NOT NULL,
	github_pat varchar(500) NOT NULL,
	description varchar(255) NULL,
	created_at timestamp DEFAULT now() NULL,
	created_by int4 NULL,
	updated_at timestamp DEFAULT now() NULL,
	updated_by int4 NULL,
	last_used_at timestamp NULL,
	is_active bool DEFAULT true NULL,
	CONSTRAINT organization_tokens_pkey PRIMARY KEY (id),
	CONSTRAINT organization_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.internal_users(id) ON DELETE SET NULL,
	CONSTRAINT organization_tokens_organization_fkey FOREIGN KEY (workspace_id,organization_id) REFERENCES public.organizations(workspace_id,id) ON DELETE CASCADE,
	CONSTRAINT organization_tokens_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.internal_users(id) ON DELETE SET NULL,
	CONSTRAINT organization_tokens_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_organization_tokens_is_active ON public.organization_tokens USING btree (is_active);
CREATE INDEX idx_organization_tokens_organization_id ON public.organization_tokens USING btree (organization_id);
CREATE INDEX idx_organization_tokens_workspace_id ON public.organization_tokens USING btree (workspace_id);
CREATE INDEX idx_organization_tokens_workspace_org ON public.organization_tokens USING btree (workspace_id, organization_id);


-- public.team_members definition

-- Drop table

-- DROP TABLE public.team_members;

CREATE TABLE public.team_members (
	team_id int8 NOT NULL,
	user_id int8 NOT NULL,
	"role" varchar(50) NULL,
	synced_at timestamp DEFAULT now() NULL,
	workspace_id int4 NOT NULL,
	CONSTRAINT team_members_pkey PRIMARY KEY (workspace_id, team_id, user_id),
	CONSTRAINT team_members_team_id_fkey FOREIGN KEY (workspace_id,team_id) REFERENCES public.teams(workspace_id,id) ON DELETE CASCADE,
	CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT team_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE
);
CREATE INDEX idx_team_members_role ON public.team_members USING btree (role);
CREATE INDEX idx_team_members_team_id ON public.team_members USING btree (team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);
CREATE INDEX idx_team_members_workspace_id ON public.team_members USING btree (workspace_id);