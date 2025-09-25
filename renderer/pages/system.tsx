import dynamic from 'next/dynamic'

const Settings = dynamic(() => import('../components/Settings').then((x) => x.ControlPanel), {
  ssr: false
})
export default function SystemSettings() {
  return <Settings />
}
