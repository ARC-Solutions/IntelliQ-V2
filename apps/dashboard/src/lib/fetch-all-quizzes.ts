export const fetchAllQuizzes = async (accessToken: string, offset: number) => {
  try {
    const URL = `${process.env.NEXT_PUBLIC_BASE_URL}/quizzes?offset=${offset}`;
    const response = await fetch(URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();

    return data;
  } catch (error) {
    console.log(error);
  }
};
