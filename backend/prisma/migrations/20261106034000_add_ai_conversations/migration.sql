CREATE TABLE "ai_conversations" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_conversations_owner_id_updated_date_idx"
    ON "ai_conversations"("owner_id", "updated_date" DESC);
CREATE INDEX "ai_messages_conversation_id_created_date_idx"
    ON "ai_messages"("conversation_id", "created_date");

ALTER TABLE "ai_conversations"
    ADD CONSTRAINT "ai_conversations_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
