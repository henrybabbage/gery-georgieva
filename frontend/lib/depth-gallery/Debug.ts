import {Pane} from 'tweakpane'

/**
 * Tweakpane v4 exposes folder APIs inherited at runtime but not always visible
 * to TypeScript tooling; wrap with a narrow `any` surface for bindings only.
 */
type DebugPaneSurface = Pane & {
	addFolder(opts: {title: string; expanded?: boolean}): DebugFolderSurface
}

type DebugFolderSurface = {
	addBinding: (
		obj: Record<string, unknown>,
		prop: string,
		opts?: Record<string, unknown>,
	) => DebugBindingSurface
}

type DebugBindingSurface = {
	on: (evt: string, handler: (ev: {value: unknown}) => void) => DebugBindingSurface
}

export class Debug {
	pane: DebugPaneSurface | null = null
	folders = new Map<string, DebugFolderSurface>()
	isVisible = false

	init(): DebugPaneSurface {
		if (this.pane) return this.pane

		this.pane = new Pane({title: 'Debug'}) as DebugPaneSurface
		this.pane.element.classList.add('debug-pane')
		this.setVisible(this.isVisible)
		return this.pane
	}

	setVisible(isVisible: boolean): void {
		this.isVisible = isVisible
		if (!this.pane) return
		this.pane.element.style.display = isVisible ? 'block' : 'none'
	}

	getFolder(folderTitle: string): DebugFolderSurface {
		this.init()
		if (this.folders.has(folderTitle)) {
			return this.folders.get(folderTitle)!
		}

		const folder = this.pane!.addFolder({title: folderTitle, expanded: true})
		this.folders.set(folderTitle, folder)
		return folder
	}

	addBinding({
		folderTitle,
		targetObject,
		property,
		label,
		options = {},
		onChange,
	}: {
		folderTitle: string
		targetObject: object
		property: string
		label: string
		options?: Record<string, unknown>
		onChange?: (value: unknown) => void
	}): void {
		const folder = this.getFolder(folderTitle)
		const binding = folder.addBinding(targetObject as Record<string, unknown>, property, {
			label,
			...options,
		})

		binding.on('change', (event: {value: unknown}) => {
			onChange?.(event.value)
		})
	}

	dispose(): void {
		if (!this.pane) return
		this.pane.dispose()
		this.pane = null
		this.folders.clear()
	}
}
