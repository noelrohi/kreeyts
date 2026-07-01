import * as React from "react"
import type { Brand } from "@/lib/higgsfield/types"
import {
  IconCheck,
  IconChevronDown,
  IconFolders,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useHiggsfieldApp } from "@/lib/higgsfield"
import { cn } from "@/lib/utils"

type BrandEditorState =
  | { mode: "create"; brand?: never }
  | { mode: "edit"; brand: Brand }

export function BrandSwitcher() {
  const { isMobile } = useSidebar()
  const { brands } = useHiggsfieldApp()
  const [editor, setEditor] = React.useState<BrandEditorState | null>(null)

  async function submitBrandName(name: string) {
    if (!editor) return false
    if (editor.mode === "create") return brands.createBrand(name)
    return brands.updateBrand(editor.brand.id, name)
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                tooltip={brands.activeLabel}
                className="no-drag h-12 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground">
                  <IconFolders className="size-4" />
                </span>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Brand
                  </span>
                  <span className="truncate text-sm font-medium">
                    {brands.activeLabel}
                  </span>
                </div>
                <IconChevronDown className="size-4 text-muted-foreground" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Brand scope
              </DropdownMenuLabel>
              <BrandMenuItem
                label="All brands"
                active={brands.view === "all"}
                onSelect={() => void brands.setActiveBrand("all")}
              />
              <BrandMenuItem
                label="Unsorted"
                active={brands.view === "unsorted"}
                onSelect={() => void brands.setActiveBrand("unsorted")}
              />
              {brands.brands.map((brand) => (
                <BrandMenuItem
                  key={brand.id}
                  label={brand.name}
                  active={
                    brands.view === "brand" && brand.id === brands.activeBrandId
                  }
                  onSelect={() => void brands.setActiveBrand("brand", brand.id)}
                />
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setEditor({ mode: "create" })}
                className="gap-2"
              >
                <IconPlus />
                New brand…
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!brands.activeBrand}
                onClick={() => {
                  if (brands.activeBrand) {
                    setEditor({ mode: "edit", brand: brands.activeBrand })
                  }
                }}
                className="gap-2"
              >
                <IconPencil />
                Rename current…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <BrandFormDialog
        state={editor}
        onOpenChange={(open) => {
          if (!open) setEditor(null)
        }}
        onSubmit={submitBrandName}
      />
    </>
  )
}

export const WorkspaceSwitcher = BrandSwitcher

function BrandMenuItem({
  label,
  active,
  onSelect,
}: {
  label: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className="gap-2"
    >
      <IconCheck className={cn("size-4", !active && "opacity-0")} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </DropdownMenuItem>
  )
}

function BrandFormDialog({
  state,
  onOpenChange,
  onSubmit,
}: {
  state: BrandEditorState | null
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => Promise<boolean>
}) {
  const [name, setName] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const open = Boolean(state)
  const isEditing = state?.mode === "edit"

  React.useEffect(() => {
    if (!state) return
    setName(state.mode === "edit" ? state.brand.name : "")
    setError(null)
    setSaving(false)
  }, [state])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim().replace(/\s+/g, " ")

    if (!trimmed) {
      setError("Name is required.")
      return
    }

    setSaving(true)
    const saved = await onSubmit(trimmed)
    setSaving(false)

    if (saved) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Rename brand" : "New brand"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Change the brand label shown in Assetwell. Higgsfield uploads stay where they are."
                : "Create another local brand layer for uploads and generated outputs."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-5">
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="brand-name">Brand name</FieldLabel>
              <Input
                id="brand-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError(null)
                }}
                disabled={saving}
                autoFocus
                placeholder="e.g. Second brand"
              />
              <FieldDescription>
                Brands are local Assetwell organization metadata; Higgsfield
                storage stays shared underneath.
              </FieldDescription>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Rename brand" : "Create brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
