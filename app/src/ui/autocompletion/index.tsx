import * as React from 'react'

interface IPosition {
  readonly top: number
  readonly left: number
}

const getCaretCoordinates: (element: HTMLElement, position: number) => IPosition = require('textarea-caret')

export class EmojiPopup extends React.Component<void, void> {

}

interface IAutocompletingTextAreaProps {
  readonly className?: string
  readonly placeholder?: string
  readonly value?: string
  readonly onChange?: (event: React.FormEvent<HTMLTextAreaElement>) => void
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void
  readonly emoji: ReadonlyArray<string>
}

class EmojiAutocompletionProvider {
  private emoji: ReadonlyArray<string>

  public constructor(emoji: ReadonlyArray<string>) {
    this.emoji = emoji
  }

  public getRegExp(): RegExp {
    return /(\\A|\\n| )(:)([a-z0-9\\+\\-][a-z0-9_]*)?/g
  }

  public render(text: string, { top, left }: IPosition) {
    const emoji = this.emoji.filter(e => e.startsWith(`:${text}`))

    return (
      <div style={{ position: 'absolute', top, left, zIndex: 2 }}>
        {emoji.map(e => <div key={e}>{e}</div>)}
      </div>
    )
  }
}

interface IAutocompletionProvider {
  getRegExp(): RegExp
  render(text: string, position: IPosition): JSX.Element | null
}

interface IAutocompletingTextAreaState {
  readonly provider: IAutocompletionProvider | null
  readonly position: IPosition | null
  readonly text: string | null
}

export class AutocompletingTextArea extends React.Component<IAutocompletingTextAreaProps, IAutocompletingTextAreaState> {
  private textArea: HTMLTextAreaElement | null = null

  public constructor(props: IAutocompletingTextAreaProps) {
    super(props)

    this.state = { provider: null, position: null, text: null }
  }

  private renderAutocompletions() {
    const provider = this.state.provider
    if (!provider) { return null }

    return provider.render(this.state.text!, this.state.position!)
  }

  public render() {
    return (
      <div style={{ position: 'relative' }}>
        {this.renderAutocompletions()}

        <textarea ref={ref => this.textArea = ref}
                  className={this.props.className}
                  placeholder={this.props.placeholder}
                  value={this.props.value}
                  onChange={event => this.onChange(event)}
                  onKeyDown={this.props.onKeyDown}/>
      </div>
    )
  }

  private onChange(event: React.FormEvent<HTMLTextAreaElement>) {
    if (this.props.onChange) {
      this.props.onChange(event)
    }

    const textArea = this.textArea!
    const caretPosition = textArea.selectionStart
    const coords = getCaretCoordinates(textArea, caretPosition)
    console.log(coords)

    const AutocompletionProviders: ReadonlyArray<IAutocompletionProvider> = [
      new EmojiAutocompletionProvider(this.props.emoji),
    ]

    const str = event.currentTarget.value
    for (const provider of AutocompletionProviders) {
      const regex = provider.getRegExp()
      let result: RegExpExecArray | null = null
      while (result = regex.exec(str)) {
        const index = regex.lastIndex
        const content = result[3] || null
        if (index === caretPosition) {
          console.log(`show completions for ${content}`)
          this.setState({ provider, position: coords, text: content })
          return
        }
      }
    }

    this.setState({ provider: null, position: null, text: null })
  }
}
