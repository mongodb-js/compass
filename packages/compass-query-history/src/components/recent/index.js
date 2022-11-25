import { listFactory } from '../list';
import RecentListItem from './recent-list-item';

const RecentList = listFactory(RecentListItem);

export default RecentList;
export { RecentList, RecentListItem };
