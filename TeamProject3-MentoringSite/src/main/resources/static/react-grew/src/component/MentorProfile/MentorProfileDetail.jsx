import { useMemberAuth } from "../../util/AuthContext";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../css/mentorProfile.css"; // 🔥 추가된 CSS 파일
import { getMentorProfileByNo } from "../../api/mentorProfileApi.js";
import { listReviewByMember } from "../../api/reviewApi.js"; // 리뷰 목록 API 추가
import * as categoryApi from "../../api/categoryApi";
import * as followApi from "../../api/followApi";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHeartCircleCheck, faHeartCirclePlus } from '@fortawesome/free-solid-svg-icons';

export default function MentorProfileDetail() {
  const { token } = useMemberAuth();
  const { mentorProfileNo } = useParams();
  const [mentorProfile, setMentorProfile] = useState(null);
  const [reviews, setReviews] = useState([]); // 빈 배열로 초기화
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("카테고리 정보 없음");
  const [isFollow, setIsfollow] = useState();


  const checkFollow = async() => {
    try {
      const response = await followApi.isExistFollow(token);
      console.log(response);
    } catch (error) {
      console.log('팔로워 여부 체크 실패')
    }
  }

  const handleFollow = () => {
    
  }

  const fetchMentorProfile = async () => {
    try {
      setLoading(true);

      // 1. 멘토 프로필 조회
      const mentorProfileResponse = await getMentorProfileByNo(
        mentorProfileNo
      );

      console.log(mentorProfile)
      setMentorProfile(mentorProfileResponse.data);

      // 2. 멘토 프로필 번호로 리뷰 목록 조회 (Authorization 헤더에 JWT 토큰 추가)
      const reviewsResponse = await listReviewByMember(
        mentorProfileNo, // memberNo 대신 mentorProfileNo를 바로 사용
        0,
        5,
        token // `token`을 Authorization 헤더에 포함시켜야 함
      );

      console.log("Reviews Response:", reviewsResponse);
      console.log("Reviews Response Data:", reviewsResponse.data); // 전체 데이터 확인
      console.log(
        "Reviews Response Data.content:",
        reviewsResponse.data?.content
      ); // content만 따로 확인

      // Check if there are reviews in the response
      if (reviewsResponse.data) {
        setReviews(reviewsResponse.data); // content 배열 처리
      } else {
        setReviews([]); // 데이터가 없으면 빈 배열 처리

        // 멘토 프로필 데이터에서 categoryNo와 memberNo 가져오기
        if (mentorProfile.categoryNo) {
          fetchCategoryName(mentorProfile.categoryNo);
        }
      }
    } catch (error) {
      setError("멘토 프로필을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFollow();
    fetchMentorProfile();
  }, [mentorProfileNo, token]);
  console.log("Reviews:", reviews); // 이 줄을 추가하여 reviews 데이터를 확인

  if (loading) return <p>로딩 중...</p>;
  const fetchCategoryName = async (categoryNo) => {
    try {
      const response = await categoryApi.ListCategory();
      const allCategories = response.data || [];
      const matchingCategory = allCategories.find(
        (cat) => cat.categoryNo === categoryNo
      );
      setCategoryName(
        matchingCategory ? matchingCategory.categoryName : "카테고리 정보 없음"
      );
    } catch (error) {
      console.error("카테고리 정보를 가져오는 중 오류 발생:", error);
      setCategoryName("카테고리 정보 없음");
    }
  };

  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="mentor-profile-detail-container">
      <div className="mentor-header">
        {/* 좌측: 이미지와 기본 정보 */}
        <div className="mentor-image-section">
          <img
            src={mentorProfile?.mentorImage || "/default-profile.png"}
            alt="프로필 이미지"
            className="mentor-profile-image-large"
          />
          <div className="mentor-basic-info">
            <h2>{mentorProfile.memberName} 멘토</h2> {/* 멤버 이름 표시 */}
            <div className="mentor-stats">
              <span className="stats-label">
                멘토링 신청 </span>
              <span>
                {mentorProfile?.mentorMentoringCount || 0}건 {" "}
              </span>
              <span className="stats-label">매칭률 </span>
              <span>
                {mentorProfile?.mentorActivityCount
                ? Math.round(
                    (mentorProfile.mentorMentoringCount /
                      mentorProfile.mentorActivityCount) *
                      100
                  )
                  : 0}  
                    %{" "}
              </span>
              <span className="stats-label">
                만족도 </span>
              <span>
                {mentorProfile?.mentorRating || 0}
              </span>
            </div>
            
            {/* 버튼 */}
            <div className="mentor-actions">
              <button className="follow-button"><FontAwesomeIcon icon={faHeartCirclePlus}/> 팔로우</button>
              <button className="question-button">멘토링 신청하기</button>
            </div>
            <div className="mentor-follow-count">{mentorProfile?.mentorFollowCount || 0}명이 팔로우 하는 중</div>
          </div>
        </div>
        {/* 우측: 상세 정보 */}
        <div className="mentor-details-section">
          <div className="mentor-section">
            <h3>대표 멘토링 분야</h3>
            <p>
              {mentorProfile?.mentorSpecialty || "대표 멘토링 분야 정보 없음"}
            </p>
            <p>{categoryName}</p>
          </div>
          <div className="mentor-section">
            <h3>멘토 소개</h3>
            <p>{mentorProfile?.mentorIntroduce || "멘토 소개 정보 없음"}</p>
          </div>
          <div className="mentor-section">
            <h3>주요 경력</h3>
            <p>{mentorProfile?.mentorCareer || "멘토 경력 정보 없음"}</p>
          </div>
        </div>
      </div>

      {/* 리뷰 목록 */}
      <div className="mentor-reviews">
        <h3>멘토 리뷰</h3>
        {reviews.length > 0 ? (
          <ul>
            {reviews.map((review) => (
              <li key={review.reviewNo}>
                <p>
                  <strong>{review.menteeName || "작성자 이름"}</strong> 님의
                  리뷰
                </p>
                <p>{review.reviewContent || "리뷰 내용이 없습니다."}</p>
                <p>평점: {review.reviewScore || "없음"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>리뷰가 없습니다.</p> // 리뷰가 없으면 해당 메시지를 표시
        )}
      </div>
    </div>
  );
}
