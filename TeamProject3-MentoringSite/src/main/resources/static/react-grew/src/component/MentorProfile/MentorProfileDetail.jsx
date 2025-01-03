import { useMemberAuth } from "../../util/AuthContext";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // useNavigate 추가
import "../../css/mentorProfile.css"; // 🔥 추가된 CSS 파일
import * as memberApi from "../../api/memberApi";
import { listReviewByMember } from "../../api/reviewApi.js"; // 리뷰 목록 API 추가
import * as categoryApi from "../../api/categoryApi";
import * as mentorBoardApi from "../../api/mentorBoardApi";
import PagenationItem from "../PagenationItem";

import MentorProfileInfo from "./MentorProfileInfo.jsx";
import MentorBoardItem from "../MentorBoard/MentorBoardItem";

export default function MentorProfileDetail() {
  const { token, member } = useMemberAuth();
  const { mentorProfileNo } = useParams();
  const navigate = useNavigate(); // navigate 훅 추가
  const [mentorProfile, setMentorProfile] = useState({});
  const [reviews, setReviews] = useState([]); // 리뷰 상태
  const [boards, setBoards] = useState([]); // 멘토 보드 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("카테고리 정보 없음");
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호
  const [totalPages, setTotalPages] = useState(0); // 전체 페이지 수
  const [itemsPerPage] = useState(3); // 페이지당 항목 수 (예: 한 페이지에 3개 항목)

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);
      const mentorProfileResponse = await memberApi.getMentorProfile(mentorProfileNo);
      console.log(mentorProfileResponse.data);
      if (!mentorProfileResponse?.data || Object.keys(mentorProfileResponse.data).length === 0) {
        console.warn("Invalid mentor profile number:", mentorProfileNo);
        navigate("/mentor-profile/list", { replace: true });
        return;
      }
      setMentorProfile(mentorProfileResponse.data);

      if (mentorProfileResponse.data.categoryNo) {
        fetchCategoryName(mentorProfileResponse.data.categoryNo);
      }
    } catch (error) {
      setError("멘토 프로필을 가져오는 중 오류가 발생했습니다.");
      navigate("/mentor-profile/list", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorBoards = async () => {
    try {
      const response = await mentorBoardApi.listMentorBoardsByProfile(mentorProfileNo, 0, 5);
      setBoards(response?.data?.content || []);
    } catch (error) {
      console.error("멘토 보드 데이터를 가져오는 중 오류 발생:", error);
    }
  };

  const fetchReview = async (page) => {
    try {
      setLoading(true);
      const reviewsResponse = await listReviewByMember(
        mentorProfileNo,
        page - 1,
        itemsPerPage,
        token
      );

      if (reviewsResponse?.data) {
        const reviewsData = reviewsResponse.data.content;

        if (reviewsData.length > 0) {
          setReviews(reviewsData);
          setTotalPages(reviewsResponse.data.totalPages);
        } else {
          setReviews([]);
        }
      } else {
        setReviews([]);
      }
    } catch (error) {
      setError("리뷰 가져오는 중 오류가 발생했습니다.");
      navigate("/mentor-profile/list", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorProfile();
    fetchMentorBoards();
  }, [mentorProfileNo]);

  useEffect(() => {
    fetchReview(currentPage);
  }, [currentPage, itemsPerPage]);

  const fetchCategoryName = async (categoryNo) => {
    try {
      const response = await categoryApi.ListCategory();
      const allCategories = response.data || [];
      const matchingCategory = allCategories.find((cat) => cat.categoryNo === categoryNo);
      setCategoryName(matchingCategory ? matchingCategory.categoryName : "카테고리 정보 없음");
    } catch (error) {
      console.error("카테고리 정보를 가져오는 중 오류 발생:", error);
      setCategoryName("카테고리 정보 없음");
    }
  };

  const handleReviewClick = (reviewNo) => {
    navigate(`/review/${reviewNo}`);
  };

  const renderStars = (score) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < score) {
        stars.push(
          <span key={i} className="star filled">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="star">
            ★
          </span>
        );
      }
    }
    return stars;
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  function calculateYearMonthDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
    const years = Math.floor(totalMonths / 12); // 연도 계산
    const months = totalMonths % 12; // 남은 개월 계산
  
    if (years > 0 && months > 0) {
      return `(${years}년 ${months}개월)`;
    } else if (years > 0) {
      return `(${years}년)`;
    } else if(months){
      return `(${months}개월)`;
    }else{
      return ""
    }
  }

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="mentor-profile-detail-container">
      <div className="mentor-header">
        <MentorProfileInfo mentorProfile={mentorProfile} />

        <div className="mentor-details-section">
          <span className="mentor-category-box">{categoryName}</span>
          <div className="mentor-section mentor-headline">
            <h2>"{mentorProfile.mentorHeadline}"</h2>
          </div>
          <div className="mentor-section">
            <h2>멘토 소개</h2>
            <pre>{mentorProfile?.mentorIntroduce || "멘토 소개 정보 없음"}</pre>
          </div>
          <div className="mentor-section">
            <h2>주요 경력</h2>
            {mentorProfile?.careerDtos &&
            mentorProfile.careerDtos.length > 0 ? (
              <ul className="mentor-profile-career">
                {mentorProfile.careerDtos.map((career, index) => (
                  <li key={index}>
                        <div className="career-date-container"> 
                          <span>{career.careerStartDate.substring(0,7)} ~ {career.careerEndDate ? career.careerEndDate.substring(0,7) : "재직중"} </span>
                          <span>
                            {calculateYearMonthDifference(career.careerStartDate, career.careerEndDate)}
                          </span>
                        </div>
                        <div className="career-info-container">
                          <div className="career-company">{career.careerCompanyName}</div>
                          <div className="career-jobtitle">{career.careerJobTitle}</div>
                        </div>
                  </li>
                ))}
              </ul>
            ) : (
              <pre>멘토 경력 정보 없음</pre>
            )}
          </div>
        </div>
      </div>

      <div className="mentor-reviews">
        <h3>멘토 리뷰</h3>
        {reviews.length > 0 ? (
          <ul>
            {reviews.map((review) => (
              <li
                key={review.reviewNo}
                onClick={() => handleReviewClick(review.reviewNo)}
                className="mentor-review-item"
              >
                <p>
                  <strong>{review.reviewTitle}</strong>
                </p>
                <p>{review.reviewContent || "리뷰 내용이 없습니다."}</p>
                <p className="review-stars">{renderStars(review.reviewScore || 0)}</p>
                <p>{review.menteeName || "작성자 이름"} 님의 리뷰</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>리뷰가 없습니다.</p>
        )}
      </div>

      <div className="mentor-boards">
        <h3>멘토 보드</h3>
        {boards.length > 0 ? (
          boards.map((board) => (
            <MentorBoardItem
              key={board.mentorBoardNo}
              board={board}
              onClick={() => navigate(`/mentor-board/detail/${board.mentorBoardNo}`)}
            />
          ))
        ) : (
          <p>등록된 멘토 보드가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
