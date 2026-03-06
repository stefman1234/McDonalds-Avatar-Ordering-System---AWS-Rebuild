import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

let docClient: DynamoDBDocumentClient | null = null;

/**
 * Returns a DynamoDB document client, or null if AWS is not configured.
 * Local dev works without DynamoDB — callers should gracefully fall back.
 */
export function getDynamoClient(): DynamoDBDocumentClient | null {
  const region = process.env.AWS_REGION;
  if (!region) return null;

  if (!docClient) {
    const client = new DynamoDBClient({ region });
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
}

export function getTableName(key: "sessions" | "cache"): string {
  if (key === "sessions") return process.env.DYNAMODB_TABLE_SESSIONS ?? "kiosk-sessions";
  return process.env.DYNAMODB_TABLE_CACHE ?? "menu-cache";
}

export async function putItem(
  table: string,
  item: Record<string, unknown>
): Promise<boolean> {
  const client = getDynamoClient();
  if (!client) return false;
  try {
    await client.send(new PutCommand({ TableName: table, Item: item }));
    return true;
  } catch (err) {
    console.error(`[DynamoDB] putItem failed on ${table}:`, err);
    return false;
  }
}

export async function getItem(
  table: string,
  key: Record<string, string>
): Promise<Record<string, unknown> | null> {
  const client = getDynamoClient();
  if (!client) return null;
  try {
    const result = await client.send(new GetCommand({ TableName: table, Key: key }));
    return (result.Item as Record<string, unknown>) ?? null;
  } catch (err) {
    console.error(`[DynamoDB] getItem failed on ${table}:`, err);
    return null;
  }
}

export async function deleteItem(
  table: string,
  key: Record<string, string>
): Promise<boolean> {
  const client = getDynamoClient();
  if (!client) return false;
  try {
    await client.send(new DeleteCommand({ TableName: table, Key: key }));
    return true;
  } catch (err) {
    console.error(`[DynamoDB] deleteItem failed on ${table}:`, err);
    return false;
  }
}
