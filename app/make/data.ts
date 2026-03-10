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
    content: `안녕하세요, 박성래입니다. 
    이곳은 저의 소소한 기록을 남기는 공간입니다. 
    앞으로 다양한 이야기를 이곳에 담아보려 합니다.
    
    잘 부탁드립니다!`,
  },
];
