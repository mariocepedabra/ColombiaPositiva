'use client'

interface Props {
  children: React.ReactNode
  canCopy: boolean
}

export default function ArticleBodyWrapper({ children, canCopy }: Props) {
  return (
    <div
      className={`body-text${canCopy ? '' : ' select-none'}`}
      onCopy={canCopy ? undefined : (e) => e.preventDefault()}
      onCut={canCopy ? undefined : (e) => e.preventDefault()}
    >
      {children}
    </div>
  )
}
