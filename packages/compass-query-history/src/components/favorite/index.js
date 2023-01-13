import { listFactory } from '../list';
import FavoriteListItem from './favorite-list-item';

const FavoriteList = listFactory(FavoriteListItem);

export default FavoriteList;
export { FavoriteList, FavoriteListItem };
