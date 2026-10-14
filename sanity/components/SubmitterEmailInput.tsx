import { useEffect, useState } from "react";
import { useClient, useFormValue } from "sanity";
import { Card, Text } from "@sanity/ui";

/** Reads the email from the submission's private.* contact document. */
export function SubmitterEmailInput() {
  const id = useFormValue(["_id"]) as string | undefined;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let active = true;
    client
      .fetch<string | null>(`*[_id == $id][0].email`, {
        id: `private.${id.replace(/^drafts\./, "")}`,
      })
      .then(
        (value) => active && setEmail(value ?? null),
        () => active && setEmail(null)
      );
    return () => {
      active = false;
    };
  }, [client, id]);

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Text size={1} muted={!email}>
        {email === undefined ? (
          "Loading…"
        ) : email ? (
          <a href={`mailto:${email}`}>{email}</a>
        ) : (
          "No email on file"
        )}
      </Text>
    </Card>
  );
}
