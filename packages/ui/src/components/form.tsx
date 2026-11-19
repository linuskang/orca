"use client"

import * as React from "react"
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  useFormState,
  type FieldError,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseControllerProps,
  type UseControllerReturn,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form"

/* -------------------------------------------------------------------------- */
/*                               Field registry                               */
/* -------------------------------------------------------------------------- */

/**
 * Tracks the ids that are actually rendered for each field name, so labels,
 * hints, errors and controls stay linked even with custom ids, and nothing
 * references an element that isn't mounted.
 */
type FieldMeta = {
  controlId?: string
  errorId?: string
  hintIds: readonly string[]
}

const EMPTY_META: FieldMeta = { hintIds: [] }

function createFieldRegistry() {
  const metas = new Map<string, FieldMeta>()
  const listeners = new Set<() => void>()

  function update(name: string, fn: (meta: FieldMeta) => FieldMeta) {
    const prev = metas.get(name) ?? EMPTY_META
    const next = fn(prev)

    if (next === prev) return

    metas.set(name, next)
    for (const listener of listeners) listener()
  }

  return {
    get: (name: string) => metas.get(name) ?? EMPTY_META,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setControlId(name: string, id: string) {
      update(name, (m) => ({ ...m, controlId: id }))
      return () =>
        update(name, (m) =>
          m.controlId === id ? { ...m, controlId: undefined } : m
        )
    },
    setErrorId(name: string, id: string) {
      update(name, (m) => ({ ...m, errorId: id }))
      return () =>
        update(name, (m) =>
          m.errorId === id ? { ...m, errorId: undefined } : m
        )
    },
    addHint(name: string, id: string) {
      update(name, (m) => ({ ...m, hintIds: [...m.hintIds, id] }))
      return () =>
        update(name, (m) => ({
          ...m,
          hintIds: m.hintIds.filter((hintId) => hintId !== id),
        }))
    },
  }
}

type FieldRegistry = ReturnType<typeof createFieldRegistry>

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

type FormContextValue = {
  id: string
  descriptionId: string
  registry: FieldRegistry
  titleId: string
  setHasDescription: (value: boolean) => void
  setHasTitle: (value: boolean) => void
}

const FormContext = React.createContext<FormContextValue | null>(null)

/** Provided by `<Form.Item>` / `<Form.Group>` so children can omit `name`. */
const FormItemContext = React.createContext<{ name: string } | null>(null)

function useHeadlessForm() {
  const context = React.use(FormContext)

  if (!context) {
    throw new Error("Form components must be used inside <Form>.")
  }

  return context
}

function useStrictFormContext<
  TFieldValues extends FieldValues = FieldValues,
>() {
  const form = useFormContext<TFieldValues>()

  if (!form) {
    throw new Error("Form components must be used inside <Form>.")
  }

  return form
}

function useResolvedName(name: string | undefined, component: string) {
  const item = React.use(FormItemContext)
  const resolved = name ?? item?.name

  if (!resolved) {
    throw new Error(
      `<Form.${component}> needs a \`name\` prop or a parent <Form.Item> / <Form.Group>.`
    )
  }

  return resolved
}

function useFieldMeta(name: string) {
  const { registry } = useHeadlessForm()

  return React.useSyncExternalStore(
    registry.subscribe,
    () => registry.get(name),
    () => EMPTY_META
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Utils                                   */
/* -------------------------------------------------------------------------- */

/** Injective (no `a.b` / `a-b` collisions) and whitespace-free, as ids require. */
function toIdSegment(value: unknown) {
  return encodeURIComponent(String(value))
}

function getFieldId(formId: string, name: string) {
  return `${formId}-field-${toIdSegment(name)}`
}

function getFieldErrorId(formId: string, name: string) {
  return `${getFieldId(formId, name)}-error`
}

function getOptionId(fieldId: string, value: unknown) {
  return `${fieldId}-option-${toIdSegment(value)}`
}

function joinIds(...ids: Array<string | false | null | undefined>) {
  return ids.filter(Boolean).join(" ") || undefined
}

/**
 * Merges refs and supports React 19 ref cleanup functions, so React doesn't
 * have to call every ref with `null` before re-attaching.
 */
function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") {
        const cleanup = ref(value)
        return typeof cleanup === "function" ? cleanup : () => ref(null)
      }

      if (ref) {
        ref.current = value
        return () => {
          ref.current = null
        }
      }

      return undefined
    })

    return () => {
      for (const cleanup of cleanups) cleanup?.()
    }
  }
}

type AnyProps = Record<string, unknown>
type AnyFunction = (...args: unknown[]) => unknown

/**
 * `asChild` prop merging: child props win, except event handlers (both run,
 * child first), `className` (joined), `style` (merged) and `ref` (merged).
 */
function mergeSlotProps(slotProps: AnyProps, childProps: AnyProps) {
  const merged: AnyProps = { ...slotProps, ...childProps }

  for (const key in slotProps) {
    const slotValue = slotProps[key]
    const childValue = childProps[key]

    if (slotValue == null || childValue == null) continue

    if (/^on[A-Z]/.test(key) && typeof slotValue === "function") {
      merged[key] = (...args: unknown[]) => {
        ;(childValue as AnyFunction)(...args)
        ;(slotValue as AnyFunction)(...args)
      }
    } else if (key === "className") {
      merged[key] = `${slotValue} ${childValue}`
    } else if (key === "style") {
      merged[key] = { ...(slotValue as object), ...(childValue as object) }
    } else if (key === "ref") {
      merged[key] = mergeRefs(
        slotValue as React.Ref<unknown>,
        childValue as React.Ref<unknown>
      )
    }
  }

  return merged
}

function getSlotChild(children: React.ReactNode, component: string) {
  const child = React.Children.only(children)

  if (!React.isValidElement<AnyProps>(child)) {
    throw new Error(
      `<Form.${component} asChild> expects a single React element child.`
    )
  }

  return child
}

/**
 * Reads the value from a native change event. Unlike RHF's default, this
 * handles file inputs (`FileList`), `<select multiple>` (array) and
 * number/range inputs (`number`, or `null` when empty). Non-events (custom
 * components calling `onChange(value)`) pass through unchanged.
 */
function readControlValue(event: unknown): unknown {
  const target = (event as { target?: unknown } | null | undefined)?.target

  if (typeof Element === "undefined" || !(target instanceof Element)) {
    return event
  }

  if (target instanceof HTMLInputElement) {
    switch (target.type) {
      case "checkbox":
        return target.checked
      case "file":
        return target.files
      case "number":
      case "range":
        return target.value === "" ? null : target.valueAsNumber
      default:
        return target.value
    }
  }

  if (target instanceof HTMLSelectElement && target.multiple) {
    return Array.from(target.selectedOptions, (option) => option.value)
  }

  if (
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return target.value
  }

  return event
}

/* -------------------------------------------------------------------------- */
/*                                    Root                                    */
/* -------------------------------------------------------------------------- */

type FormProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  React.ComponentProps<"form">,
  "onInvalid" | "onSubmit"
> & {
  /** Externally created form. When provided, `formOptions` is ignored. */
  form?: UseFormReturn<TFieldValues>
  formOptions?: UseFormProps<TFieldValues>
  onInvalid?: SubmitErrorHandler<TFieldValues>
  onSubmit: SubmitHandler<TFieldValues>
}

function FormRoot<TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues>
) {
  // Only create an internal form instance when one isn't provided.
  // (Toggling between the two modes remounts the form, which is intended.)
  return props.form ? (
    <FormImpl {...props} form={props.form} />
  ) : (
    <FormWithInternalState {...props} />
  )
}

function FormWithInternalState<TFieldValues extends FieldValues = FieldValues>({
  formOptions,
  ...props
}: FormProps<TFieldValues>) {
  const form = useForm<TFieldValues>(formOptions)

  return <FormImpl {...props} form={form} />
}

function FormImpl<TFieldValues extends FieldValues = FieldValues>({
  "aria-describedby": ariaDescribedBy,
  "aria-labelledby": ariaLabelledBy,
  children,
  form,
  formOptions: _formOptions,
  onInvalid,
  onSubmit,
  ...props
}: FormProps<TFieldValues> & { form: UseFormReturn<TFieldValues> }) {
  const id = React.useId()
  const [registry] = React.useState(createFieldRegistry)
  const [hasTitle, setHasTitle] = React.useState(false)
  const [hasDescription, setHasDescription] = React.useState(false)
  const context = React.useMemo<FormContextValue>(
    () => ({
      id,
      descriptionId: `${id}-description`,
      registry,
      titleId: `${id}-title`,
      setHasDescription,
      setHasTitle,
    }),
    [id, registry]
  )

  return (
    <FormContext value={context}>
      <FormProvider {...form}>
        <form
          noValidate
          {...props}
          // Only reference Title/Description when they are mounted,
          // and let explicit props win.
          aria-describedby={
            ariaDescribedBy ??
            (hasDescription ? context.descriptionId : undefined)
          }
          aria-labelledby={
            ariaLabelledBy ?? (hasTitle ? context.titleId : undefined)
          }
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        >
          {children}
        </form>
      </FormProvider>
    </FormContext>
  )
}

function useRegisterPresence(setPresent: (value: boolean) => void) {
  React.useLayoutEffect(() => {
    setPresent(true)
    return () => setPresent(false)
  }, [setPresent])
}

function FormTitle(props: Omit<React.ComponentProps<"h2">, "id">) {
  const { setHasTitle, titleId } = useHeadlessForm()
  useRegisterPresence(setHasTitle)

  return <h2 {...props} id={titleId} />
}

function FormDescription(props: Omit<React.ComponentProps<"p">, "id">) {
  const { descriptionId, setHasDescription } = useHeadlessForm()
  useRegisterPresence(setHasDescription)

  return <p {...props} id={descriptionId} />
}

/* -------------------------------------------------------------------------- */
/*                                Item / Group                                */
/* -------------------------------------------------------------------------- */

type FormItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  children: React.ReactNode
  name: TName
}

/** Renders nothing; lets nested Label/Field/Hint/Error omit `name`. */
function FormItem<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ children, name }: FormItemProps<TFieldValues, TName>) {
  const value = React.useMemo(() => ({ name }), [name])

  return <FormItemContext value={value}>{children}</FormItemContext>
}

type FormGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = React.ComponentProps<"fieldset"> & {
  name: TName
}

/**
 * `<fieldset>` for radio / checkbox groups. Like `Form.Item`, nested parts can
 * omit `name`; the fieldset is described by the group's hints and error.
 */
function FormGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  "aria-describedby": ariaDescribedBy,
  children,
  name,
  ...props
}: FormGroupProps<TFieldValues, TName>) {
  const meta = useFieldMeta(name)
  const value = React.useMemo(() => ({ name }), [name])

  return (
    <FormItemContext value={value}>
      <fieldset
        {...props}
        aria-describedby={joinIds(
          ariaDescribedBy,
          ...meta.hintIds,
          meta.errorId
        )}
      >
        {children}
      </fieldset>
    </FormItemContext>
  )
}

function FormLegend(props: React.ComponentProps<"legend">) {
  return <legend {...props} />
}

/* -------------------------------------------------------------------------- */
/*                                 Label / Hint                               */
/* -------------------------------------------------------------------------- */

type FormLabelProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = React.ComponentProps<"label"> & {
  name?: TName
  /** Targets one radio / checkbox option of the field by its `value`. */
  value?: unknown
}

function FormLabel<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  htmlFor,
  name: nameProp,
  value,
  ...props
}: FormLabelProps<TFieldValues, TName>) {
  const { id: formId } = useHeadlessForm()
  const name = useResolvedName(nameProp, "Label")
  const meta = useFieldMeta(name)
  const fieldId = getFieldId(formId, name)

  return (
    <label
      htmlFor={
        htmlFor ??
        (value !== undefined
          ? getOptionId(fieldId, value)
          : (meta.controlId ?? fieldId))
      }
      {...props}
    />
  )
}

type FormHintProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = React.ComponentProps<"p"> & {
  name?: TName
}

/** Field-level helper text, linked to the control via `aria-describedby`. */
function FormHint<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  id: providedId,
  name: nameProp,
  ...props
}: FormHintProps<TFieldValues, TName>) {
  const { registry } = useHeadlessForm()
  const name = useResolvedName(nameProp, "Hint")
  const generatedId = React.useId()
  const id = providedId ?? generatedId

  React.useLayoutEffect(() => registry.addHint(name, id), [registry, name, id])

  return <p {...props} id={id} />
}

/* -------------------------------------------------------------------------- */
/*                                    Field                                   */
/* -------------------------------------------------------------------------- */

type FormFieldAriaProps = {
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  "aria-required"?: boolean
  id: string
}

type FormFieldRenderProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerReturn<TFieldValues, TName> & {
  /** Spread onto custom controls to get the same a11y wiring as native ones. */
  ariaProps: FormFieldAriaProps
  errorId: string
  fieldId: string
  isRequired: boolean
}

type FormFieldOverride<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = (
  props: FormFieldRenderProps<TFieldValues, TName>
) => Record<string, unknown>

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<UseControllerProps<TFieldValues, TName>, "control" | "name"> & {
  children:
    | React.ReactElement
    | ((props: FormFieldRenderProps<TFieldValues, TName>) => React.ReactNode)
  /** Display transform for native controls (store value → input value). */
  format?: (value: FieldPathValue<TFieldValues, TName>) => unknown
  /** Optional inside `<Form.Item>` / `<Form.Group>`. */
  name?: TName
  override?: FormFieldOverride<TFieldValues, TName>
  /** Input transform for native controls (input value → store value). */
  parse?: (value: unknown) => FieldPathValue<TFieldValues, TName>
  required?: boolean | string
}

type NativeControlProps = {
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  "aria-required"?: boolean
  checked?: boolean
  disabled?: boolean
  id?: string
  multiple?: boolean
  name?: string
  onBlur?: (event: React.FocusEvent) => void
  onChange?: (event: React.ChangeEvent) => void
  ref?: React.Ref<unknown>
  required?: boolean
  type?: string
  value?: unknown
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  children,
  format,
  name: nameProp,
  override,
  parse,
  required,
  ...props
}: FormFieldProps<TFieldValues, TName>) {
  const { id: formId, registry } = useHeadlessForm()
  const name = useResolvedName(nameProp, "Field") as TName
  const rules =
    required === undefined || props.rules?.required !== undefined
      ? props.rules
      : {
          ...props.rules,
          required:
            typeof required === "string"
              ? required
              : required && "This field is required",
        }
  const requiredRule = rules?.required
  const isRequired =
    typeof requiredRule === "object"
      ? Boolean(requiredRule.value)
      : Boolean(requiredRule)
  const controller = useController<TFieldValues, TName>({
    ...props,
    name,
    rules,
  })
  const { field, fieldState } = controller
  const meta = useFieldMeta(name)
  const fieldId = getFieldId(formId, name)
  const errorId = getFieldErrorId(formId, name)

  const child =
    typeof children === "function"
      ? undefined
      : (React.Children.only(
          children
        ) as React.ReactElement<NativeControlProps>)
  const childProps = child?.props
  const checkbox = childProps?.type === "checkbox"
  const radio = childProps?.type === "radio"
  const file = childProps?.type === "file"
  // A checkbox bound to an array value acts as one option of a group.
  const value: unknown = field.value
  const groupValue =
    checkbox && Array.isArray(value) ? (value as unknown[]) : undefined
  const isOption = radio || groupValue !== undefined
  // Options share a name, so they need distinct ids.
  const controlId =
    childProps?.id ??
    (isOption ? getOptionId(fieldId, childProps?.value) : fieldId)

  // Let <Form.Label> follow a custom id set on the control.
  const registeredControlId =
    child && !isOption && controlId !== fieldId ? controlId : undefined
  React.useLayoutEffect(
    () =>
      registeredControlId
        ? registry.setControlId(name, registeredControlId)
        : undefined,
    [registry, name, registeredControlId]
  )

  // Stable merged ref, so React doesn't detach/re-attach on every render.
  const childRef = childProps?.ref
  const ref = React.useMemo(
    () => mergeRefs(childRef, field.ref),
    [childRef, field.ref]
  )

  const ariaProps: FormFieldAriaProps = {
    // `meta.errorId` is only set while a <Form.Error> is actually rendered.
    "aria-describedby": joinIds(...meta.hintIds, meta.errorId),
    "aria-invalid": fieldState.invalid || undefined,
    "aria-required": isRequired || undefined,
    id: fieldId,
  }
  const renderProps: FormFieldRenderProps<TFieldValues, TName> = {
    ...controller,
    ariaProps,
    errorId,
    fieldId,
    isRequired,
  }

  if (typeof children === "function" || !child || !childProps) {
    return (children as (p: typeof renderProps) => React.ReactNode)(renderProps)
  }

  const baseProps: NativeControlProps = {
    "aria-describedby": joinIds(
      childProps["aria-describedby"],
      ariaProps["aria-describedby"]
    ),
    "aria-invalid": ariaProps["aria-invalid"],
    // Don't clobber a `disabled` set directly on the child.
    disabled: childProps.disabled || field.disabled,
    id: controlId,
    name: field.name,
    ref,
  }

  if (isRequired) {
    // `required` on every checkbox of a group would mean "check all".
    if (groupValue === undefined) baseProps.required = true
    // `aria-required` is not valid on role="radio"/grouped checkboxes.
    if (!isOption) baseProps["aria-required"] = true
  }

  if (override) {
    return React.cloneElement(child, {
      ...baseProps,
      ...override(renderProps),
    } as NativeControlProps)
  }

  const commit = (next: unknown) => field.onChange(parse ? parse(next) : next)

  const controlProps: NativeControlProps = {
    ...baseProps,
    onBlur: (event) => {
      childProps.onBlur?.(event)
      field.onBlur()
    },
    onChange: (event) => {
      childProps.onChange?.(event)

      if (groupValue !== undefined) {
        const checked = (event.target as HTMLInputElement).checked
        field.onChange(
          checked
            ? [...groupValue, childProps.value]
            : groupValue.filter((v) => v !== childProps.value)
        )
      } else if (radio) {
        // Use the original `value` prop so numbers stay numbers.
        commit(childProps.value)
      } else {
        commit(readControlValue(event))
      }
    },
  }

  if (groupValue !== undefined) {
    controlProps.checked = groupValue.includes(childProps.value)
  } else if (checkbox) {
    controlProps.checked = Boolean(field.value)
  } else if (radio) {
    controlProps.checked = field.value === childProps.value
  } else if (!file) {
    controlProps.value = format
      ? format(field.value)
      : (field.value ?? (childProps.multiple ? [] : ""))
  }

  return React.cloneElement(child, controlProps)
}

/* -------------------------------------------------------------------------- */
/*                                    Error                                   */
/* -------------------------------------------------------------------------- */

type FormErrorProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<React.ComponentProps<"p">, "children"> & {
  children?: React.ReactNode | ((error: FieldError) => React.ReactNode)
  /** Optional inside `<Form.Item>` / `<Form.Group>`. */
  name?: TName
}

function FormError<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  children,
  id: providedId,
  name: nameProp,
  ...props
}: FormErrorProps<TFieldValues, TName>) {
  const { id: formId, registry } = useHeadlessForm()
  const name = useResolvedName(nameProp, "Error") as TName
  const form = useStrictFormContext<TFieldValues>()
  const formState = useFormState<TFieldValues>({
    control: form.control,
    name,
  })
  const error = form.getFieldState(name, formState).error
  const content = !error
    ? null
    : typeof children === "function"
      ? children(error)
      : (children ?? error.message)
  // e.g. `rules: { required: true }` produces an empty message.
  const visible = content != null && content !== "" && content !== false
  const id = providedId ?? getFieldErrorId(formId, name)

  // Register only while rendered, so controls never point at a missing id.
  React.useLayoutEffect(
    () => (visible ? registry.setErrorId(name, id) : undefined),
    [registry, name, id, visible]
  )

  if (!visible) {
    return null
  }

  return (
    <p id={id} role="alert" {...props}>
      {content}
    </p>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Submit / Reset                              */
/* -------------------------------------------------------------------------- */

type FormSubmitRenderProps<TFieldValues extends FieldValues = FieldValues> = {
  disabled: boolean
  form: UseFormReturn<TFieldValues>
  isPending: boolean
  isSubmitting: boolean
}

type FormSubmitProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  React.ComponentProps<"button">,
  "children" | "type"
> & {
  /** Render the single child element as the button instead of a `<button>`. */
  asChild?: boolean
  children:
    | React.ReactNode
    | ((props: FormSubmitRenderProps<TFieldValues>) => React.ReactNode)
  disableWhileSubmitting?: boolean
  /** Extra pending state, e.g. from a mutation that outlives `onSubmit`. */
  pending?: boolean
}

function FormSubmit<TFieldValues extends FieldValues = FieldValues>({
  asChild = false,
  children,
  disableWhileSubmitting = true,
  pending = false,
  ...buttonProps
}: FormSubmitProps<TFieldValues>) {
  const form = useStrictFormContext<TFieldValues>()
  // Subscribe locally instead of relying on the root re-rendering.
  const { isSubmitting } = useFormState<TFieldValues>({
    control: form.control,
  })
  const isPending = pending || isSubmitting
  const disabled = pending || (disableWhileSubmitting && isSubmitting)

  if (typeof children === "function") {
    return children({ disabled, form, isPending, isSubmitting })
  }

  if (asChild) {
    const child = getSlotChild(children, "Submit")
    const merged = mergeSlotProps(buttonProps, child.props)

    return React.cloneElement(child, {
      ...merged,
      "aria-busy": Boolean(merged["aria-busy"]) || isPending || undefined,
      disabled: Boolean(merged.disabled) || disabled,
      type: "submit",
    })
  }

  return (
    <button
      {...buttonProps}
      aria-busy={isPending || undefined}
      disabled={buttonProps.disabled || disabled}
      type="submit"
    >
      {children}
    </button>
  )
}

type FormResetRenderProps<TFieldValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TFieldValues>
  isDirty: boolean
  isSubmitting: boolean
}

type FormResetProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  React.ComponentProps<"button">,
  "children" | "type"
> & {
  /** Render the single child element as the button instead of a `<button>`. */
  asChild?: boolean
  children:
    | React.ReactNode
    | ((props: FormResetRenderProps<TFieldValues>) => React.ReactNode)
}

function FormReset<TFieldValues extends FieldValues = FieldValues>({
  asChild = false,
  children,
  onClick,
  ...buttonProps
}: FormResetProps<TFieldValues>) {
  const form = useStrictFormContext<TFieldValues>()
  const { isDirty, isSubmitting } = useFormState<TFieldValues>({
    control: form.control,
  })

  if (typeof children === "function") {
    return children({ form, isDirty, isSubmitting })
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)

    if (!event.defaultPrevented) {
      form.reset()
    }
  }

  if (asChild) {
    const child = getSlotChild(children, "Reset")

    return React.cloneElement(child, {
      // Child handler runs first; `preventDefault()` there skips reset.
      ...mergeSlotProps({ ...buttonProps, onClick: handleClick }, child.props),
      type: "button",
    })
  }

  return (
    <button {...buttonProps} type="button" onClick={handleClick}>
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

const Form = Object.assign(FormRoot, {
  Description: FormDescription,
  Error: FormError,
  Field: FormField,
  Group: FormGroup,
  Hint: FormHint,
  Item: FormItem,
  Label: FormLabel,
  Legend: FormLegend,
  Reset: FormReset,
  Submit: FormSubmit,
  Title: FormTitle,
})

type TypedForm<TFieldValues extends FieldValues> = ((
  props: FormProps<TFieldValues>
) => React.ReactNode) & {
  Description: typeof FormDescription
  Error: <TName extends FieldPath<TFieldValues>>(
    props: FormErrorProps<TFieldValues, TName>
  ) => React.ReactNode
  Field: <TName extends FieldPath<TFieldValues>>(
    props: FormFieldProps<TFieldValues, TName>
  ) => React.ReactNode
  Group: <TName extends FieldPath<TFieldValues>>(
    props: FormGroupProps<TFieldValues, TName>
  ) => React.ReactNode
  Hint: <TName extends FieldPath<TFieldValues>>(
    props: FormHintProps<TFieldValues, TName>
  ) => React.ReactNode
  Item: <TName extends FieldPath<TFieldValues>>(
    props: FormItemProps<TFieldValues, TName>
  ) => React.ReactNode
  Label: <TName extends FieldPath<TFieldValues>>(
    props: FormLabelProps<TFieldValues, TName>
  ) => React.ReactNode
  Legend: typeof FormLegend
  Reset: (props: FormResetProps<TFieldValues>) => React.ReactNode
  Submit: (props: FormSubmitProps<TFieldValues>) => React.ReactNode
  Title: typeof FormTitle
}

/**
 * Returns `Form` with every `name` prop type-checked against `TFieldValues`.
 *
 * @example
 * const SignupForm = createForm<{ email: string; terms: boolean }>()
 * <SignupForm.Field name="emial" /> // ← type error
 */
function createForm<TFieldValues extends FieldValues>() {
  return Form as unknown as TypedForm<TFieldValues>
}

export { createForm, Form, useHeadlessForm }
export type {
  FormErrorProps,
  FormFieldAriaProps,
  FormFieldOverride,
  FormFieldProps,
  FormFieldRenderProps,
  FormGroupProps,
  FormHintProps,
  FormItemProps,
  FormLabelProps,
  FormProps,
  FormResetProps,
  FormSubmitProps,
  TypedForm,
}
