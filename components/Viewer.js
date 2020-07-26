import { useRecoilState, useRecoilValue } from 'recoil';
import DeckGL from 'deck.gl';
import { OrthographicView } from '@deck.gl/core';

import { viewerViewState } from '../state/atoms';
import { layersSelector } from '../state/selectors';

function WrappedViewStateDeck({ layers }) {
  const [viewState, setViewState] = useRecoilState(viewerViewState);

  // If viewState hasn't been updated, use the first loader to guess viewState
  // TODO: There is probably a better place / way to set the intital view and this is a hack.
  if (viewState?.default && layers[0]?.props?.loader?.base) {
    const { loader } = layers[0].props;
    const [height, width] = loader.base.shape.slice(-2);
    setViewState({ zoom: -loader.numLevels, target: [width/2, height/2, 0] });
  }
  
  return (
    <DeckGL
      layers={layers}
      viewState={viewState}
      onViewStateChange={e => setViewState(e.viewState)}
      views={new OrthographicView({ id: 'ortho', controller: true })}
    />
  )
}

function Viewer() {
  const layerConstructors = useRecoilValue(layersSelector);
  const layers = layerConstructors.map(([Layer, props]) => new Layer(props));
  return <WrappedViewStateDeck layers={layers}/>
}

export default Viewer;