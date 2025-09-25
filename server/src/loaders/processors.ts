import { CalibProcessor, NodeProcessor } from '@/services/processor'
import Container from 'typedi'

export default () => {
  Container.get(CalibProcessor).init()
  Container.get(NodeProcessor).init()
}
