import { listFactory } from '../list';
import FavoriteListItem from './favorite-list-item';
import Saving from '../saving';

const FavoriteList = listFactory(FavoriteListItem, Saving);

export default FavoriteList;
export { FavoriteList, FavoriteListItem };
