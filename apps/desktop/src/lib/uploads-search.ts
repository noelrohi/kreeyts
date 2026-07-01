import type { Brand, ReferenceAsset } from "./higgsfield/types"

export interface UploadSearchIndexItem {
  asset: ReferenceAsset
  searchText: string
}

export function buildUploadSearchIndex(
  references: ReferenceAsset[],
  brands: Brand[],
): UploadSearchIndexItem[] {
  const brandNames = new Map(brands.map((brand) => [brand.id, brand.name]))

  return references.map((asset) => ({
    asset,
    searchText: normalizeSearchText([
      asset.name,
      asset.uploadId,
      asset.createdAt,
      asset.modifiedAt,
      brandSearchLabel(asset.brandId, brandNames),
    ]),
  }))
}

export function filterUploadSearchIndex(
  index: UploadSearchIndexItem[],
  rawQuery: string,
): ReferenceAsset[] {
  const query = normalizeSearchQuery(rawQuery)
  if (!query) return index.map((item) => item.asset)

  return index
    .filter((item) => item.searchText.includes(query))
    .map((item) => item.asset)
}

function brandSearchLabel(
  brandId: string | null | undefined,
  brandNames: ReadonlyMap<string, string>,
) {
  if (!brandId) return "Unsorted"
  return brandNames.get(brandId) ?? null
}

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase()
}

function normalizeSearchText(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase()
}
