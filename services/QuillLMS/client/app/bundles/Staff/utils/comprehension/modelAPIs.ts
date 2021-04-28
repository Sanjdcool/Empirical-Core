import { handleApiError, apiFetch, getModelsUrl } from '../../helpers/comprehension';

export const fetchModels = async (key: string, promptId?: any, state?: string) => {
  const url = getModelsUrl(promptId, state);

  const response = await apiFetch(url);
  let models = await response.json();
  if(models && models.automl_models) {
    models = models.automl_models;
  }
  return { error: handleApiError('Failed to fetch models, please try again.', response), models: models };
}

export const fetchModel = async (key: string, modelId: string) => {
  const response = await apiFetch(`automl_models/${modelId}`);
  const model = await response.json();
  return { error: handleApiError('Failed to fetch models, please try again.', response), model: model };
}

export const createModel = async (autoMLId: string, promptId: number) => {
  const response = await apiFetch(`automl_models`, {
    method: 'POST',
    body: JSON.stringify({ automl_model_id: autoMLId, prompt_id: promptId })
  });
  const newModel = await response.json();
  return { error: handleApiError('Failed to create model, please try again.', response), model: newModel };
}

export const updateModel = async (modelId: number, note: string) => {
  const response = await apiFetch(`automl_models/${modelId}`, {
    method: 'PUT',
    body: JSON.stringify({ note: note })
  })
  const updatedModel = await response.json();
  return { error: handleApiError('Failed to create model, please try again.', response), model: updatedModel };
}

export const activateModel = async(modelId: string) => {
  const response = await apiFetch(`automl_models/${modelId}/activate`, {
    method: 'PUT',
    body: JSON.stringify({ model_id: modelId })
  });
  return { error: handleApiError('Failed to create model, please try again.', response)};
}
