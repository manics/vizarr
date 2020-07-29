import { useEffect, useReducer } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import styled from 'styled-components';
import { StaticImageLayer, VivViewerLayer } from '../node_modules/@hubmap/vitessce-image-viewer/dist/bundle.es.js';

import { sourceInfoState, layerStateFamily }from '../state/atoms';
import { createZarrLoader, channelsToVivProps } from '../utils';

const Container = styled.div`
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: white;
  font-size: 0.75em;
  border-radius: 0.3em;
  overflow: hidden;
  background-color: rgba(50, 50, 50, 0.7);
  margin-bottom: 0.2em;
  padding: 0.3em 0.2em;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;

const Name = styled.span`
  font-size: 1em;
  font-weight: bold;
`;

function OpacitySlider({ id }) {
  const [layer, setLayer] = useRecoilState(layerStateFamily(id));
  const handleChange = e => {
    const opacity = +e.target.value;
    setLayer(([prevLayer, prevProps]) => [prevLayer, {...prevProps, opacity }])
  }
  const inputId = `opacity-${id}`;
  return (
    <Row>
      <label for={inputId}>opacity:</label>
      <input
        id={inputId}
        value={layer[1].opacity}
        onChange={handleChange}
        type="range"
        min="0"
        max="1"
        step="0.01"
      />
    </Row>
  )
}

function HideButton({ id }) {
  const [layer, setLayer] = useRecoilState(layerStateFamily(id));
  const handleChange = () => {
    setLayer(([prevLayer, prevProps]) => {
      const on = !prevProps.on;
      return [prevLayer, {...prevProps, on }];
    });
  }
  const label = layer[1].on ? 'Hide' : 'Show';
  return (
    <button onClick={handleChange}>{label}</button>
  );
}


function LayerController({ id }) {
  const sourceInfo = useRecoilValue(sourceInfoState);
  const [open, toggle] = useReducer(v => !v, true);
  const [layer, setLayer] = useRecoilState(layerStateFamily(id));

  useEffect(() => {
    async function initLayer({
      source,
      dimensions,
      channels,
      colormap = '',
      opacity = 1,
      on = true,
    }) {
      const loader = await createZarrLoader(source, dimensions);
      // Internal viv issue, this is a hack to get the appropriate WebGL textures.
      // Loader dtypes only have littleendian lookups, but all loaders return little endian
      // regardless of source.
      loader.dtype = '<' + loader.dtype.slice(1);
      const vivProps = channelsToVivProps(channels);
      const Layer = loader.numLevels === 1 ? StaticImageLayer : VivViewerLayer;
      return [Layer, { id, on, loader, colormap, opacity, ...vivProps }];
    }

    if (id in sourceInfo) {
      const layerInfo = sourceInfo[id];
      initLayer(layerInfo).then(l => setLayer(l));
    }

  }, [sourceInfo])

  // If layer hasn't been initialized, don't render control.
  const layerProps = layer[1];
  if (!layerProps?.loader) return null;

  const { name } = sourceInfo[id];
  return (
    <Container>
      <Row>
        <HideButton id={id}/>
        <Name>{name}</Name>
      </Row>
      {open ? <OpacitySlider id={id} /> : null}
    </Container>
  );
}

export default LayerController;
