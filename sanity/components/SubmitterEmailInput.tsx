import { useEffect, useState } from "react";
import { useClient, useFormValue } from "sanity";
import { Card, Stack, Text } from "@sanity/ui";

interface Contact {
  email?: string;
  phone?: string;
}

/** Reads the submitter's contact details from the private.* document. */
export function SubmitterEmailInput() {
  const id = useFormValue(["_id"]) as string | undefined;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [contact, setContact] = useState<Contact | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let active = true;
    client
      .fetch<Contact | null>(`*[_id == $id][0]{email, phone}`, {
        id: `private.${id.replace(/^drafts\./, "")}`,
      })
      .then(
        (value) => active && setContact(value),
        () => active && setContact(null)
      );
    return () => {
      active = false;
    };
  }, [client, id]);

  return (
    <Card padding={3} radius={2} border tone="transparent">
      {contact === undefined ? (
        <Text size={1} muted>
          Loading…
        </Text>
      ) : !contact?.email && !contact?.phone ? (
        <Text size={1} muted>
          No contact details on file
        </Text>
      ) : (
        <Stack space={3}>
          {contact.email && (
            <Text size={1}>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </Text>
          )}
          {contact.phone && (
            <Text size={1}>
              Mobile Money: <a href={`tel:+${contact.phone}`}>+{contact.phone}</a>
            </Text>
          )}
        </Stack>
      )}
    </Card>
  );
}
