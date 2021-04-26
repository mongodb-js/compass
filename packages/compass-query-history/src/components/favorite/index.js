import { listFactory } from 'components/list';
import FavoriteListItem from './favorite-list-item';
import Saving from 'components/saving';

const FavoriteList = listFactory(FavoriteListItem, Saving);

export default FavoriteList;
export {
  FavoriteList,
  FavoriteListItem
};
