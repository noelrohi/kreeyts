import path from "node:path"
import type {
  AssetwellAssignUploadsToBrandRequest,
  AssetwellBrand,
  AssetwellBrandAssignment,
  AssetwellBrandState,
  AssetwellBrandView,
  AssetwellCreateBrandRequest,
  AssetwellSetActiveBrandRequest,
  AssetwellUpdateBrandRequest,
} from "@assetwell/desktop-bridge"

import {
  readJsonFileSync,
  stateDirectory,
  writeJsonFile,
} from "./settings-store"

const BRAND_STATE_SCHEMA_VERSION = 1
const DEFAULT_BRAND_ID = "brand-default"
const DEFAULT_BRAND_NAME = "Default brand"

interface BrandStateFile {
  schemaVersion?: unknown
  brands?: unknown
  activeBrandId?: unknown
  activeBrandView?: unknown
  assignments?: unknown
  updatedAt?: unknown
}

interface StoredBrand {
  id: string
  name: string
}

interface StoredBrandAssignment {
  uploadId: string
  brandId: string | null
}

export async function loadBrandState(): Promise<AssetwellBrandState> {
  const state = normalizeBrandState(readBrandStateFile())
  await writeBrandStateFile(state)
  return state
}

export async function setActiveBrand(
  request: AssetwellSetActiveBrandRequest,
): Promise<AssetwellBrandState> {
  const state = normalizeBrandState(readBrandStateFile())
  const requestedView = normalizeBrandView(
    request.view ?? (request.id ? "brand" : "all"),
  )

  if (requestedView !== "brand") {
    return writeAndReturn({
      ...state,
      activeBrandView: requestedView,
      activeBrandId: null,
    })
  }

  const brand = requireBrand(state.brands, request.id)
  return writeAndReturn({
    ...state,
    activeBrandView: "brand",
    activeBrandId: brand.id,
  })
}

export async function createBrand(
  request: AssetwellCreateBrandRequest,
): Promise<AssetwellBrandState> {
  const state = normalizeBrandState(readBrandStateFile())
  const name = requireBrandName(request.name)
  assertUniqueBrandName(state.brands, name)

  const brand = {
    id: dedupeBrandId(brandIdFromName(name), state.brands),
    name,
    isDefault: false,
  } satisfies AssetwellBrand

  return writeAndReturn({
    ...state,
    brands: [...state.brands, brand],
    activeBrandView: "brand",
    activeBrandId: brand.id,
  })
}

export async function updateBrand(
  request: AssetwellUpdateBrandRequest,
): Promise<AssetwellBrandState> {
  const state = normalizeBrandState(readBrandStateFile())
  const brand = requireBrand(state.brands, request.id)
  const name = requireBrandName(request.name)
  assertUniqueBrandName(state.brands, name, brand.id)

  return writeAndReturn({
    ...state,
    brands: state.brands.map((current) =>
      current.id === brand.id ? { ...current, name } : current,
    ),
  })
}

export async function assignUploadsToBrand(
  request: AssetwellAssignUploadsToBrandRequest,
): Promise<AssetwellBrandState> {
  const state = normalizeBrandState(readBrandStateFile())
  const brandId = normalizeNullableBrandId(request.brandId)
  if (brandId) requireBrand(state.brands, brandId)

  const uploadIds = uniqueUploadIds(request.uploadIds)
  if (uploadIds.length === 0) return state

  const assignments = new Map(
    state.assignments.map((assignment) => [
      assignment.uploadId,
      assignment.brandId,
    ]),
  )
  for (const uploadId of uploadIds) {
    assignments.set(uploadId, brandId)
  }

  return writeAndReturn({
    ...state,
    assignments: Array.from(assignments, ([uploadId, assignedBrandId]) => ({
      uploadId,
      brandId: assignedBrandId,
    })),
  })
}

function readBrandStateFile(): BrandStateFile {
  return readJsonFileSync<BrandStateFile>(brandStatePath()) ?? {}
}

async function writeAndReturn(state: AssetwellBrandState) {
  await writeBrandStateFile(state)
  return state
}

async function writeBrandStateFile(state: AssetwellBrandState) {
  await writeJsonFile(brandStatePath(), {
    schemaVersion: BRAND_STATE_SCHEMA_VERSION,
    brands: state.brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
    })),
    activeBrandView: state.activeBrandView,
    activeBrandId: state.activeBrandId,
    assignments: state.assignments.map((assignment) => ({
      uploadId: assignment.uploadId,
      brandId: assignment.brandId,
    })),
    updatedAt: new Date().toISOString(),
  })
}

function normalizeBrandState(file: BrandStateFile): AssetwellBrandState {
  const brands = normalizeBrands(file.brands)
  let activeBrandView = normalizeBrandView(file.activeBrandView)
  let activeBrandId = normalizeNullableBrandId(file.activeBrandId)

  if (activeBrandView === "brand") {
    const activeBrand = activeBrandId ? findBrand(brands, activeBrandId) : null
    if (!activeBrand) {
      activeBrandView = "all"
      activeBrandId = null
    } else {
      activeBrandId = activeBrand.id
    }
  } else {
    activeBrandId = null
  }

  return {
    brands,
    activeBrandView,
    activeBrandId,
    assignments: normalizeAssignments(file.assignments, brands),
  }
}

function normalizeBrands(value: unknown): AssetwellBrand[] {
  const savedBrands = Array.isArray(value)
    ? value.flatMap((item) => {
        const brand = storedBrand(item)
        return brand ? [brand] : []
      })
    : []
  const brands: AssetwellBrand[] = []
  const savedDefault = savedBrands.find((brand) => isDefaultBrandId(brand.id))

  addBrand(brands, {
    id: DEFAULT_BRAND_ID,
    name: savedDefault?.name ?? DEFAULT_BRAND_NAME,
    isDefault: true,
  })

  for (const brand of savedBrands) {
    if (!isDefaultBrandId(brand.id)) {
      addBrand(brands, { ...brand, isDefault: false })
    }
  }

  return brands
}

function storedBrand(value: unknown): StoredBrand | null {
  if (!value || typeof value !== "object") return null

  const record = value as { id?: unknown; name?: unknown }
  const id = normalizeBrandId(record.id)
  const name = normalizeBrandName(record.name)
  if (!id || !name) return null

  return { id, name }
}

function normalizeAssignments(
  value: unknown,
  brands: AssetwellBrand[],
): AssetwellBrandAssignment[] {
  if (!Array.isArray(value)) return []

  const assignments = new Map<string, string | null>()
  for (const item of value) {
    const assignment = storedAssignment(item, brands)
    if (assignment) assignments.set(assignment.uploadId, assignment.brandId)
  }

  return Array.from(assignments, ([uploadId, brandId]) => ({
    uploadId,
    brandId,
  }))
}

function storedAssignment(
  value: unknown,
  brands: AssetwellBrand[],
): StoredBrandAssignment | null {
  if (!value || typeof value !== "object") return null

  const record = value as { uploadId?: unknown; brandId?: unknown }
  const uploadId = normalizeUploadId(record.uploadId)
  if (!uploadId) return null

  const brandId = normalizeNullableBrandId(record.brandId)
  return {
    uploadId,
    brandId: brandId && findBrand(brands, brandId) ? brandId : null,
  }
}

function normalizeBrandView(value: unknown): AssetwellBrandView {
  return value === "brand" || value === "unsorted" || value === "all"
    ? value
    : "all"
}

function requireBrand(brands: AssetwellBrand[], value: unknown) {
  const brandId = normalizeBrandId(value)
  const brand = brandId ? findBrand(brands, brandId) : null

  if (!brand) {
    throw new Error("Unknown brand.")
  }

  return brand
}

function requireBrandName(value: unknown) {
  const name = normalizeBrandName(value)

  if (!name) {
    throw new Error("Brand name is required.")
  }

  return name
}

function assertUniqueBrandName(
  brands: AssetwellBrand[],
  name: string,
  exceptBrandId?: string,
) {
  const nameKey = brandNameKey(name)
  const duplicate = brands.find(
    (brand) =>
      brand.id !== exceptBrandId && brandNameKey(brand.name) === nameKey,
  )

  if (duplicate) {
    throw new Error("A brand with that name already exists.")
  }
}

function brandNameKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase()
}

function normalizeBrandName(value: unknown) {
  if (typeof value !== "string") return null

  const name = value
    .trim()
    .replace(/[\u0000-\u001f]+/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim()

  return name || null
}

function normalizeNullableBrandId(value: unknown) {
  if (value === null || value === undefined) return null
  return normalizeBrandId(value)
}

function normalizeBrandId(value: unknown) {
  if (typeof value !== "string") return null

  const brandId = value.trim()
  return isSafeBrandId(brandId) ? brandId : null
}

function brandIdFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)

  const brandId = slug.startsWith("brand-") ? slug : `brand-${slug}`
  return (
    normalizeBrandId(brandId || `brand-${Date.now()}`) ?? `brand-${Date.now()}`
  )
}

function isSafeBrandId(value: string) {
  return (
    value.length > 0 &&
    value === value.trim() &&
    value !== "." &&
    value !== ".." &&
    !path.isAbsolute(value) &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !/[<>:"|?*\u0000-\u001f]/.test(value) &&
    !/[. ]$/.test(value)
  )
}

function dedupeBrandId(requestedBrandId: string, brands: AssetwellBrand[]) {
  let index = 1
  let candidate = requestedBrandId

  while (findBrand(brands, candidate)) {
    index += 1
    candidate = `${requestedBrandId}-${index}`
  }

  return candidate
}

function findBrand(brands: AssetwellBrand[], brandId: string) {
  return brands.find(
    (brand) => brand.id.toLowerCase() === brandId.toLowerCase(),
  )
}

function addBrand(brands: AssetwellBrand[], brand: AssetwellBrand) {
  if (!findBrand(brands, brand.id)) brands.push(brand)
}

function isDefaultBrandId(brandId: string) {
  return brandId.toLowerCase() === DEFAULT_BRAND_ID.toLowerCase()
}

function uniqueUploadIds(value: unknown) {
  if (!Array.isArray(value)) return []

  const uploadIds = new Set<string>()
  for (const item of value) {
    const uploadId = normalizeUploadId(item)
    if (uploadId) uploadIds.add(uploadId)
  }

  return Array.from(uploadIds)
}

function normalizeUploadId(value: unknown) {
  if (typeof value !== "string") return null

  const uploadId = value.trim().slice(0, 200)
  return uploadId || null
}

function brandStatePath() {
  return path.join(stateDirectory(), "brands.v1.json")
}
