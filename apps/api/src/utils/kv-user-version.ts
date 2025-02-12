export async function getUserCacheVersion(
  kv: KVNamespace,
  userId: string
): Promise<number> {
  const value = await kv.get(`version:${userId}`);
  if (!value) {
    return 1;
  }
  return parseInt(value, 10) || 1;
}

export async function incrementUserCacheVersion(
  kv: KVNamespace,
  userId: string
) {
  const currentVersion = await getUserCacheVersion(kv, userId);
  const newVersion = currentVersion + 1;
  await kv.put(`version:${userId}`, String(newVersion));
  return newVersion;
}
