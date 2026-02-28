CREATE TABLE event_reviewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    event_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,

    CONSTRAINT fk_event_reviewers_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_reviewers_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_event_reviewer
        UNIQUE (event_id, reviewer_id)
);

CREATE TABLE session_review_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    session_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_session_review_assignments_session
        FOREIGN KEY (session_id)
        REFERENCES sessions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_session_review_assignments_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_session_reviewer
        UNIQUE (session_id, reviewer_id)
);

ALTER TABLE events
ADD COLUMN reviewers_per_session INTEGER DEFAULT 1;