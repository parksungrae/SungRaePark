export interface Post {
  id: string;
  title: string;
  date: string;
  content: string;
}

export const posts: Post[] = [
  {
    id: "1",
    title: "첫글입니다",
    date: "2026-03-10",
    // 첫 페이지에서의 40.6개의 점은 평균 하루 자살 인원입니다.
    // 소노 시온의 영화 "자살클럽"을 모티브로 만들었습니다.
    // 사이트는 시뮬레이션 세상이며
    // 제 점들은 각각 의미를 가지게 할 것 입니다.
    content: `각 점에 의미를 담고싶습니다.
	좋은 하루 보내세요`,
  },
];
