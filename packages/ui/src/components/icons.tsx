"use client";

import { forwardRef } from "react";

export type IconType = React.FC<SVGIconProps>;

export interface SVGIconProps {
	children?: React.ReactNode;
	className?: string;
	fill?: string;
	size?: number;
	stroke?: string;
	strokeLinecap?: "round" | "butt" | "square" | "inherit";
	strokeLinejoin?: "round" | "inherit" | "miter" | "bevel";
	strokeWidth?: number;
	viewBox?: string;
}

const SVGIcon = forwardRef<SVGSVGElement, SVGIconProps>(
	(
		{
			size = 20,
			stroke = "currentColor",
			fill = "currentColor",
			strokeWidth = 0.25,
			strokeLinecap = "round",
			strokeLinejoin = "round",
			className,
			children,
			viewBox,
		},
		ref
	) => {
		const intrinsicContentDimension = 20;
		const defaultViewBox = `0 0 ${intrinsicContentDimension} ${intrinsicContentDimension}`;

		return (
			<svg
				aria-label="icon"
				className={className}
				fill={fill}
				height={size}
				ref={ref}
				role="img"
				stroke={stroke}
				strokeLinecap={strokeLinecap}
				strokeLinejoin={strokeLinejoin}
				strokeWidth={strokeWidth}
				viewBox={viewBox || defaultViewBox}
				width={size}
				xmlns="http://www.w3.org/2000/svg"
			>
				{children}
			</svg>
		);
	}
);
SVGIcon.displayName = "SVGIcon";

export const Icons = {
	LogoSmall: (props: SVGIconProps) => (
		<SVGIcon size={28} {...props} viewBox="0 0 28 28">
			<path
				fill="currentColor"
				d="M14.854 2.698a9.148 9.148 0 0 1 0 5.786l-.542 1.623 2.012-1.783a7.378 7.378 0 0 0 2.333-4.04l.57-2.786 1.733.354-.57 2.787a9.149 9.149 0 0 1-2.892 5.01l-1.283 1.137 2.635-.538a7.379 7.379 0 0 0 4.04-2.333l1.888-2.129 1.324 1.174-1.887 2.129a9.148 9.148 0 0 1-5.01 2.892l-1.68.344 2.551.85a7.379 7.379 0 0 0 4.666 0l2.698-.9.56 1.68-2.698.9a9.148 9.148 0 0 1-5.785 0l-1.625-.543 1.784 2.012a7.375 7.375 0 0 0 4.04 2.331l2.787.572-.355 1.733-2.787-.57a9.148 9.148 0 0 1-5.01-2.892l-1.136-1.281.539 2.633a7.376 7.376 0 0 0 2.331 4.04l2.129 1.887L21.04 26.1l-2.129-1.887a9.146 9.146 0 0 1-2.892-5.01l-.343-1.677-.85 2.55a7.379 7.379 0 0 0 0 4.665l.9 2.698-1.68.56-.9-2.698a9.148 9.148 0 0 1 0-5.785l.541-1.627-2.01 1.785a7.38 7.38 0 0 0-2.334 4.04l-.57 2.788-1.733-.357.57-2.785a9.148 9.148 0 0 1 2.892-5.01l1.281-1.138-2.633.54a7.377 7.377 0 0 0-4.04 2.332l-1.887 2.129L1.9 21.04l1.887-2.129a9.146 9.146 0 0 1 5.01-2.892l1.678-.345-2.55-.849a7.379 7.379 0 0 0-4.666 0l-2.698.9-.56-1.68 2.698-.9a9.148 9.148 0 0 1 5.786 0l1.623.542-1.783-2.01a7.377 7.377 0 0 0-4.04-2.334l-2.786-.57.354-1.733 2.787.57a9.148 9.148 0 0 1 5.01 2.892l1.135 1.28-.538-2.632a7.376 7.376 0 0 0-2.331-4.04L5.786 3.223 6.96 1.898 9.09 3.785a9.148 9.148 0 0 1 2.892 5.01l.344 1.68.85-2.551a7.379 7.379 0 0 0 0-4.666l-.9-2.698 1.68-.56.9 2.698ZM14 11.234A2.767 2.767 0 0 0 11.234 14l.015.283a2.766 2.766 0 0 0 5.502 0l.014-.283-.014-.283a2.766 2.766 0 0 0-2.468-2.468L14 11.234Z"
			/>
		</SVGIcon>
	),

	Logo: (props: SVGIconProps) => (
		<SVGIcon size={32} {...props}>
			{/* Faworra text logo */}
			<text
				fill="currentColor"
				fontFamily="var(--font-hedvig-sans), system-ui, sans-serif"
				fontSize="24"
				fontWeight="600"
				x="0"
				y="24"
			>
				Faworra
			</text>
		</SVGIcon>
	),

	Overview: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M13 13v8h8v-8h-8zM3 13v8h8v-8H3zM3 3v8h8V3H3zm10 0v8h8V3h-8z"
				fill="currentColor"
			/>
		</SVGIcon>
	),

	Transactions: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M5.97685 13.9743H7.45122V12.5H5.97685V13.9743ZM5.97685 10.737H7.45122V9.26288H5.97685V10.737ZM5.97685 7.49996H7.45122V6.02558H5.97685V7.49996ZM9.24622 13.862H13.9898V12.6123H9.24622V13.862ZM9.24622 10.625H13.9898V9.37496H9.24622V10.625ZM9.24622 7.38767H13.9898V6.13788H9.24622V7.38767ZM2.91602 17.0833V2.91663H17.0827V17.0833H2.91602ZM4.16602 15.8333H15.8327V4.16663H4.16602V15.8333Z"
				fill="currentColor"
			/>
		</SVGIcon>
	),

	Settings: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M8.0768 17.9167L7.75951 15.3781C7.53631 15.3034 7.30742 15.1988 7.07284 15.0642C6.83839 14.9295 6.62874 14.7852 6.44388 14.6315L4.09284 15.625L2.16992 12.2917L4.20346 10.7548C4.1843 10.6309 4.17069 10.5065 4.16263 10.3815C4.15457 10.2565 4.15055 10.132 4.15055 10.0079C4.15055 9.88945 4.15457 9.76904 4.16263 9.64668C4.17069 9.52432 4.1843 9.3905 4.20346 9.24522L2.16992 7.70834L4.09284 4.39105L6.43576 5.37668C6.63673 5.21751 6.85124 5.07195 7.0793 4.94001C7.30735 4.80807 7.53145 4.70202 7.75159 4.62188L8.0768 2.08334H11.923L12.2403 4.6298C12.4903 4.72063 12.7165 4.82668 12.9189 4.94793C13.1214 5.06918 13.3258 5.21209 13.532 5.37668L15.907 4.39105L17.8299 7.70834L15.7643 9.26918C15.7942 9.40376 15.8105 9.52959 15.8133 9.64668C15.8159 9.76362 15.8172 9.8814 15.8172 10C15.8172 10.1132 15.8145 10.2283 15.8091 10.3454C15.8038 10.4624 15.7846 10.5962 15.7516 10.7469L17.8012 12.2917L15.878 15.625L13.532 14.6233C13.3258 14.7879 13.1153 14.9335 12.9005 15.06C12.6858 15.1867 12.4658 15.2901 12.2403 15.3702L11.923 17.9167H8.0768ZM9.16659 16.6667H10.8045L11.1041 14.4344C11.5294 14.3233 11.918 14.1654 12.2699 13.9608C12.622 13.7561 12.9615 13.493 13.2885 13.1715L15.3589 14.0417L16.1795 12.625L14.3718 11.2629C14.4412 11.0471 14.4885 10.8355 14.5135 10.6281C14.5386 10.4209 14.5512 10.2115 14.5512 10C14.5512 9.78307 14.5386 9.57369 14.5135 9.37189C14.4885 9.16994 14.4412 8.96369 14.3718 8.75314L16.1953 7.37501L15.3749 5.95834L13.2803 6.84126C13.0015 6.5432 12.6674 6.27987 12.278 6.05126C11.8886 5.82265 11.4946 5.66077 11.0962 5.56564L10.8333 3.33334H9.17951L8.90367 5.55772C8.47853 5.65814 8.08596 5.81195 7.72596 6.01918C7.36583 6.22654 7.02228 6.49362 6.69534 6.82043L4.62492 5.95834L3.80451 7.37501L5.60409 8.71626C5.53464 8.91404 5.48603 9.11973 5.45826 9.33334C5.43048 9.54695 5.41659 9.77182 5.41659 10.0079C5.41659 10.2249 5.43048 10.4375 5.45826 10.6458C5.48603 10.8542 5.53201 11.0599 5.59617 11.2629L3.80451 12.625L4.62492 14.0417L6.68742 13.1667C7.00367 13.4914 7.3418 13.7574 7.7018 13.9648C8.06194 14.172 8.45992 14.3312 8.89576 14.4423L9.16659 16.6667ZM10.0095 12.5C10.7028 12.5 11.2928 12.2567 11.7795 11.77C12.2662 11.2833 12.5095 10.6933 12.5095 10C12.5095 9.30668 12.2662 8.71668 11.7795 8.23001C11.2928 7.74334 10.7028 7.50001 10.0095 7.50001C9.30756 7.50001 8.71541 7.74334 8.23305 8.23001C7.75069 8.71668 7.50951 9.30668 7.50951 10C7.50951 10.6933 7.75069 11.2833 8.23305 11.77C8.71541 12.2567 9.30756 12.5 10.0095 12.5Z"
				fill="currentColor"
			/>
		</SVGIcon>
	),

	Search: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
				fill="currentColor"
			/>
		</SVGIcon>
	),

	ChevronDown: (props: SVGIconProps) => (
		<SVGIcon {...props} viewBox="0 0 24 24">
			<path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor" />
		</SVGIcon>
	),

	ChevronUp: (props: SVGIconProps) => (
		<SVGIcon {...props} viewBox="0 0 24 24">
			<path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" fill="currentColor" />
		</SVGIcon>
	),

	Sidebar: (props: SVGIconProps) => (
		<SVGIcon {...props} viewBox="0 -960 960 960">
			<path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm240-80h400v-480H400v480Zm-80 0v-480H160v480h160Zm-160 0v-480 480Zm160 0h80-80Zm0-480h80-80Z" />
		</SVGIcon>
	),

	Apps: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path d="M4.99936 16.3461C4.62922 16.3461 4.31235 16.2143 4.04874 15.9507C3.78513 15.687 3.65332 15.3702 3.65332 15C3.65332 14.6299 3.78513 14.313 4.04874 14.0494C4.31235 13.7858 4.62922 13.654 4.99936 13.654C5.3695 13.654 5.68638 13.7858 5.94999 14.0494C6.2136 14.313 6.3454 14.6299 6.3454 15C6.3454 15.3702 6.2136 15.687 5.94999 15.9507C5.68638 16.2143 5.3695 16.3461 4.99936 16.3461ZM9.99936 16.3461C9.62922 16.3461 9.31235 16.2143 9.04874 15.9507C8.78513 15.687 8.65332 15.3702 8.65332 15C8.65332 14.6299 8.78513 14.313 9.04874 14.0494C9.31235 13.7858 9.62922 13.654 9.99936 13.654C10.3695 13.654 10.6864 13.7858 10.95 14.0494C11.2136 14.313 11.3454 14.6299 11.3454 15C11.3454 15.3702 11.2136 15.687 10.95 15.9507C10.6864 16.2143 10.3695 16.3461 9.99936 16.3461ZM14.9994 16.3461C14.6292 16.3461 14.3123 16.2143 14.0487 15.9507C13.7851 15.687 13.6533 15.3702 13.6533 15C13.6533 14.6299 13.7851 14.313 14.0487 14.0494C14.3123 13.7858 14.6292 13.654 14.9994 13.654C15.3695 13.654 15.6864 13.7858 15.95 14.0494C16.2136 14.313 16.3454 14.6299 16.3454 15C16.3454 15.3702 16.2136 15.687 15.95 15.9507C15.6864 16.2143 15.3695 16.3461 14.9994 16.3461ZM4.99936 11.3461C4.62922 11.3461 4.31235 11.2143 4.04874 10.9507C3.78513 10.687 3.65332 10.3702 3.65332 10C3.65332 9.62989 3.78513 9.31302 4.04874 9.04941C4.31235 8.7858 4.62922 8.65399 4.99936 8.65399C5.3695 8.65399 5.68638 8.7858 5.94999 9.04941C6.2136 9.31302 6.3454 9.62989 6.3454 10C6.3454 10.3702 6.2136 10.687 5.94999 10.9507C5.68638 11.2143 5.3695 11.3461 4.99936 11.3461ZM9.99936 11.3461C9.62922 11.3461 9.31235 11.2143 9.04874 10.9507C8.78513 10.687 8.65332 10.3702 8.65332 10C8.65332 9.62989 8.78513 9.31302 9.04874 9.04941C9.31235 8.7858 9.62922 8.65399 9.99936 8.65399C10.3695 8.65399 10.6864 8.7858 10.95 9.04941C11.2136 9.31302 11.3454 9.62989 11.3454 10C11.3454 10.3702 11.2136 10.687 10.95 10.9507C10.6864 11.2143 10.3695 11.3461 9.99936 11.3461ZM14.9994 11.3461C14.6292 11.3461 14.3123 11.2143 14.0487 10.9507C13.7851 10.687 13.6533 10.3702 13.6533 10C13.6533 9.62989 13.7851 9.31302 14.0487 9.04941C14.3123 8.7858 14.6292 8.65399 14.9994 8.65399C15.3695 8.65399 15.6864 8.7858 15.95 9.04941C16.2136 9.31302 16.3454 9.62989 16.3454 10C16.3454 10.3702 16.2136 10.687 15.95 10.9507C15.6864 11.2143 15.3695 11.3461 14.9994 11.3461ZM4.99936 6.34607C4.62922 6.34607 4.31235 6.21427 4.04874 5.95066C3.78513 5.68705 3.65332 5.37017 3.65332 5.00003C3.65332 4.62989 3.78513 4.31302 4.04874 4.04941C4.31235 3.7858 4.62922 3.65399 4.99936 3.65399C5.3695 3.65399 5.68638 3.7858 5.94999 4.04941C6.2136 4.31302 6.3454 4.62989 6.3454 5.00003C6.3454 5.37017 6.2136 5.68705 5.94999 5.95066C5.68638 6.21427 5.3695 6.34607 4.99936 6.34607ZM9.99936 6.34607C9.62922 6.34607 9.31235 6.21427 9.04874 5.95066C8.78513 5.68705 8.65332 5.37017 8.65332 5.00003C8.65332 4.62989 8.78513 4.31302 9.04874 4.04941C9.31235 3.7858 9.62922 3.65399 9.99936 3.65399C10.3695 3.65399 10.6864 3.7858 10.95 4.04941C11.2136 4.31302 11.3454 4.62989 11.3454 5.00003C11.3454 5.37017 11.2136 5.68705 10.95 5.95066C10.6864 6.21427 10.3695 6.34607 9.99936 6.34607ZM14.9994 6.34607C14.6292 6.34607 14.3123 6.21427 14.0487 5.95066C13.7851 5.68705 13.6533 5.37017 13.6533 5.00003C13.6533 4.62989 13.7851 4.31302 14.0487 4.04941C14.3123 3.7858 14.6292 3.65399 14.9994 3.65399C15.3695 3.65399 15.6864 3.7858 15.95 4.04941C16.2136 4.31302 16.3454 4.62989 16.3454 5.00003C16.3454 5.37017 16.2136 5.68705 15.95 5.95066C15.6864 6.21427 15.3695 6.34607 14.9994 6.34607ZM4.99936 11.3461C4.62922 11.3461 4.31235 11.2143 4.04874 10.9507C3.78513 10.687 3.65332 10.3702 3.65332 10C3.65332 9.62989 3.78513 9.31302 4.04874 9.04941C4.31235 8.7858 4.62922 8.65399 4.99936 8.65399C5.3695 8.65399 5.68638 8.7858 5.94999 9.04941C6.2136 9.31302 6.3454 9.62989 6.3454 10C6.3454 10.3702 6.2136 10.687 5.94999 10.9507C5.68638 11.2143 5.3695 11.3461 4.99936 11.3461ZM9.99936 11.3461C9.62922 11.3461 9.31235 11.2143 9.04874 10.9507C8.78513 10.687 8.65332 10.3702 8.65332 10C8.65332 9.62989 8.78513 9.31302 9.04874 9.04941C9.31235 8.7858 9.62922 8.65399 9.99936 8.65399C10.3695 8.65399 10.6864 8.7858 10.95 9.04941C11.2136 9.31302 11.3454 9.62989 11.3454 10C11.3454 10.3702 11.2136 10.687 10.95 10.9507C10.6864 11.2143 10.3695 11.3461 9.99936 11.3461ZM14.9994 11.3461C14.6292 11.3461 14.3123 11.2143 14.0487 10.9507C13.7851 10.687 13.6533 10.3702 13.6533 10C13.6533 9.62989 13.7851 9.31302 14.0487 9.04941C14.3123 8.7858 14.6292 8.65399 14.9994 8.65399C15.3695 8.65399 15.6864 8.7858 15.95 9.04941C16.2136 9.31302 16.3454 9.62989 16.3454 10C16.3454 10.3702 16.2136 10.687 15.95 10.9507C15.6864 11.2143 15.3695 11.3461 14.9994 11.3461ZM4.99936 6.34607C4.62922 6.34607 4.31235 6.21427 4.04874 5.95066C3.78513 5.68705 3.65332 5.37017 3.65332 5.00003C3.65332 4.62989 3.78513 4.31302 4.04874 4.04941C4.31235 3.7858 4.62922 3.65399 4.99936 3.65399C5.3695 3.65399 5.68638 3.7858 5.94999 4.04941C6.2136 4.31302 6.3454 4.62989 6.3454 5.00003C6.3454 5.37017 6.2136 5.68705 5.94999 5.95066C5.68638 6.21427 5.3695 6.34607 4.99936 6.34607ZM9.99936 6.34607C9.62922 6.34607 9.31235 6.21427 9.04874 5.95066C8.78513 5.68705 8.65332 5.37017 8.65332 5.00003C8.65332 4.62989 8.78513 4.31302 9.04874 4.04941C9.31235 3.7858 9.62922 3.65399 9.99936 3.65399C10.3695 3.65399 10.6864 3.7858 10.95 4.04941C11.2136 4.31302 11.3454 4.62989 11.3454 5.00003C11.3454 5.37017 11.2136 5.68705 10.95 5.95066C10.6864 6.21427 10.3695 6.34607 9.99936 6.34607ZM14.9994 6.34607C14.6292 6.34607 14.3123 6.21427 14.0487 5.95066C13.7851 5.68705 13.6533 5.37017 13.6533 5.00003C13.6533 4.62989 13.7851 4.31302 14.0487 4.04941C14.3123 3.7858 14.6292 3.65399 14.9994 3.65399C15.3695 3.65399 15.6864 3.7858 15.95 4.04941C16.2136 4.31302 16.3454 4.62989 16.3454 5.00003C16.3454 5.37017 16.2136 5.68705 15.95 5.95066C15.6864 6.21427 15.3695 6.34607 14.9994 6.34607Z" />
		</SVGIcon>
	),

	Invoice: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path d="M6.875 14.7916H13.125V13.5416H6.875V14.7916ZM6.875 11.4583H13.125V10.2083H6.875V11.4583ZM3.75 17.9166V2.08331H11.875L16.25 6.45831V17.9166H3.75ZM11.25 7.08331V3.33331H5V16.6666H15V7.08331H11.25Z" fill="currentColor" />
		</SVGIcon>
	),

	Tracker: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path d="M7.65956 2.29166V1.04166H12.3391V2.29166H7.65956ZM9.37435 11.5064H10.6243V6.82686H9.37435V11.5064ZM9.99935 17.9167C9.02504 17.9167 8.10838 17.7308 7.24935 17.3589C6.39032 16.9871 5.63928 16.4796 4.99622 15.8364C4.35303 15.1934 3.84553 14.4424 3.47372 13.5833C3.10192 12.7243 2.91602 11.8076 2.91602 10.8333C2.91602 9.85902 3.10192 8.94235 3.47372 8.08332C3.84553 7.2243 4.35303 6.47325 4.99622 5.8302C5.63928 5.187 6.39032 4.6795 7.24935 4.3077C8.10838 3.93589 9.02504 3.74999 9.99935 3.74999C10.8338 3.74999 11.6375 3.89159 12.4104 4.17478C13.1833 4.45784 13.901 4.86325 14.5635 5.39103L15.6018 4.3527L16.48 5.23082L15.4416 6.26916C15.9694 6.93166 16.3748 7.64936 16.6579 8.42228C16.9411 9.1952 17.0827 9.99888 17.0827 10.8333C17.0827 11.8076 16.8968 12.7243 16.525 13.5833C16.1532 14.4424 15.6457 15.1934 15.0025 15.8364C14.3594 16.4796 13.6084 16.9871 12.7493 17.3589C11.8903 17.7308 10.9737 17.9167 9.99935 17.9167ZM9.99935 16.6667C11.6105 16.6667 12.9855 16.0972 14.1243 14.9583C15.2632 13.8194 15.8327 12.4444 15.8327 10.8333C15.8327 9.22221 15.2632 7.84721 14.1243 6.70832C12.9855 5.56943 11.6105 4.99999 9.99935 4.99999C8.38824 4.99999 7.01324 5.56943 5.87435 6.70832C4.73546 7.84721 4.16602 9.22221 4.16602 10.8333C4.16602 12.4444 4.73546 13.8194 5.87435 14.9583C7.01324 16.0972 8.38824 16.6667 9.99935 16.6667Z" fill="currentColor" />
		</SVGIcon>
	),

	Customers: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path d="M14.0702 16.9871C13.2681 16.9871 12.5815 16.7015 12.0104 16.1304C11.4393 15.5592 11.1537 14.8725 11.1537 14.0704C11.1537 13.2683 11.4393 12.5817 12.0104 12.0106C12.5815 11.4395 13.2681 11.1539 14.0702 11.1539C14.8723 11.1539 15.5589 11.4395 16.1302 12.0106C16.7013 12.5817 16.9869 13.2683 16.9869 14.0704C16.9869 14.8725 16.7013 15.5592 16.1302 16.1304C15.5589 16.7015 14.8723 16.9871 14.0702 16.9871ZM14.0702 15.7371C14.5285 15.7371 14.9209 15.5739 15.2473 15.2475C15.5737 14.9211 15.7369 14.5287 15.7369 14.0704C15.7369 13.6121 15.5737 13.2197 15.2473 12.8933C14.9209 12.5669 14.5285 12.4037 14.0702 12.4037C13.6119 12.4037 13.2195 12.5669 12.8931 12.8933C12.5667 13.2197 12.4035 13.6121 12.4035 14.0704C12.4035 14.5287 12.5667 14.9211 12.8931 15.2475C13.2195 15.5739 13.6119 15.7371 14.0702 15.7371ZM5.92936 14.4871C5.12728 14.4871 4.44061 14.2015 3.86936 13.6304C3.29825 13.0592 3.0127 12.3725 3.0127 11.5704C3.0127 10.7683 3.29825 10.0817 3.86936 9.51061C4.44061 8.9395 5.12728 8.65395 5.92936 8.65395C6.73145 8.65395 7.41804 8.9395 7.98915 9.51061C8.56027 10.0817 8.84582 10.7683 8.84582 11.5704C8.84582 12.3725 8.56027 13.0592 7.98915 13.6304C7.41804 14.2015 6.73145 14.4871 5.92936 14.4871ZM5.92936 13.2371C6.3877 13.2371 6.78006 13.0739 7.10645 12.7475C7.43283 12.4211 7.59603 12.0287 7.59603 11.5704C7.59603 11.1121 7.43283 10.7197 7.10645 10.3933C6.78006 10.0669 6.3877 9.90374 5.92936 9.90374C5.47103 9.90374 5.07867 10.0669 4.75228 10.3933C4.42589 10.7197 4.2627 11.1121 4.2627 11.5704C4.2627 12.0287 4.42589 12.4211 4.75228 12.7475C5.07867 13.0739 5.47103 13.2371 5.92936 13.2371ZM9.16645 8.07686C8.36436 8.07686 7.67777 7.79131 7.10665 7.2202C6.5354 6.64895 6.24978 5.96228 6.24978 5.1602C6.24978 4.35811 6.5354 3.67152 7.10665 3.10041C7.67777 2.52916 8.36436 2.24353 9.16645 2.24353C9.96853 2.24353 10.6551 2.52916 11.2262 3.10041C11.7975 3.67152 12.0831 4.35811 12.0831 5.1602C12.0831 5.96228 11.7975 6.64895 11.2262 7.2202C10.6551 7.79131 9.96853 8.07686 9.16645 8.07686ZM9.16645 6.82686C9.62478 6.82686 10.0171 6.66367 10.3435 6.33728C10.6699 6.01089 10.8331 5.61853 10.8331 5.1602C10.8331 4.70186 10.6699 4.3095 10.3435 3.98311C10.0171 3.65672 9.62478 3.49353 9.16645 3.49353C8.70811 3.49353 8.31575 3.65672 7.98936 3.98311C7.66297 4.3095 7.49978 4.70186 7.49978 5.1602C7.49978 5.61853 7.66297 6.01089 7.98936 6.33728C8.31575 6.66367 8.70811 6.82686 9.16645 6.82686Z" fill="currentColor" />
		</SVGIcon>
	),

	Vault: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path d="M9.99967 12.7083C10.4045 12.7083 10.7488 12.5665 11.0326 12.2829C11.3162 11.9992 11.458 11.6549 11.458 11.25C11.458 10.8451 11.3162 10.5008 11.0326 10.2171C10.7488 9.93347 10.4045 9.79167 9.99967 9.79167C9.59481 9.79167 9.25051 9.93347 8.96676 10.2171C8.68315 10.5008 8.54134 10.8451 8.54134 11.25C8.54134 11.6549 8.68315 11.9992 8.96676 12.2829C9.25051 12.5665 9.59481 12.7083 9.99967 12.7083ZM2.08301 17.0833V5.41667H7.08301V2.5H12.9163V5.41667H17.9163V17.0833H2.08301ZM3.33301 15.8333H16.6663V6.66667H3.33301V15.8333ZM8.33301 5.41667H11.6663V3.75H8.33301V5.41667Z" fill="currentColor" />
		</SVGIcon>
	),

	Monitoring: (props: SVGIconProps) => (
		<SVGIcon {...props} viewBox="0 -960 960 960">
			<path d="M120-120v-80l80-80v160h-80Zm160 0v-240l80-80v320h-80Zm160 0v-320l80 81v239h-80Zm160 0v-239l80-80v319h-80Zm160 0v-400l80-80v480h-80ZM120-327v-113l280-280 160 160 280-280v113L560-447 400-607 120-327Z" fill="currentColor" />
		</SVGIcon>
	),

	Inbox2: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path d="M2.91602 17.0833V2.91663H17.0827V17.0833H2.91602ZM4.16602 15.8333H15.8327V13.1731H13.0923C12.7291 13.7009 12.278 14.1106 11.7389 14.4023C11.1999 14.6939 10.62 14.8398 9.99935 14.8398C9.37865 14.8398 8.79879 14.6939 8.25977 14.4023C7.72074 14.1106 7.26963 13.7009 6.90643 13.1731H4.16602V15.8333ZM9.99935 13.5898C10.5271 13.5898 11.0063 13.437 11.4368 13.1314C11.8674 12.8259 12.166 12.4231 12.3327 11.9231H15.8327V4.16663H4.16602V11.9231H7.66602C7.83268 12.4231 8.13129 12.8259 8.56185 13.1314C8.9924 13.437 9.47157 13.5898 9.99935 13.5898Z" fill="currentColor" />
		</SVGIcon>
	),

	Check: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M5 12l5 5L20 7"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	X: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M6 6l12 12M6 18L18 6"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Plus: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M12 5v14M5 12h14"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Minus: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M5 12h14"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Menu: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M4 6h16M4 12h16M4 18h16"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	MoreHorizontal: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<circle cx="6" cy="12" fill="currentColor" r="1.5" />
			<circle cx="12" cy="12" fill="currentColor" r="1.5" />
			<circle cx="18" cy="12" fill="currentColor" r="1.5" />
		</SVGIcon>
	),

	Bell: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path
				d="M13.73 21a2 2 0 0 1-3.46 0"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	User: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<circle
				cx="12"
				cy="8"
				fill="none"
				r="4"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<path
				d="M4 20c0-4 4-6 8-6s8 2 8 6"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	LogOut: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="16 17 21 12 16 7"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="21"
				x2="9"
				y1="12"
				y2="12"
			/>
		</SVGIcon>
	),

	ExternalLink: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="15 3 21 3 21 9"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="10"
				x2="21"
				y1="14"
				y2="3"
			/>
		</SVGIcon>
	),

	ArrowRight: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="5"
				x2="19"
				y1="12"
				y2="12"
			/>
			<polyline
				fill="none"
				points="12 5 19 12 12 19"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	ArrowLeft: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="19"
				x2="5"
				y1="12"
				y2="12"
			/>
			<polyline
				fill="none"
				points="12 19 5 12 12 5"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	RefreshCw: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polyline
				fill="none"
				points="23 4 23 10 17 10"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="1 20 1 14 7 14"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path
				d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Calendar: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<rect
				fill="none"
				height="18"
				stroke="currentColor"
				strokeWidth="2"
				width="18"
				x="3"
				y="4"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="16"
				x2="16"
				y1="2"
				y2="6"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="8"
				x2="8"
				y1="2"
				y2="6"
			/>
			<line
				stroke="currentColor"
				strokeWidth="2"
				x1="3"
				x2="21"
				y1="10"
				y2="10"
			/>
		</SVGIcon>
	),

	Filter: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polygon
				fill="none"
				points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Download: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="7 10 12 15 17 10"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12"
				y1="15"
				y2="3"
			/>
		</SVGIcon>
	),

	Upload: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="17 8 12 3 7 8"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12"
				y1="3"
				y2="15"
			/>
		</SVGIcon>
	),

	Eye: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<circle
				cx="12"
				cy="12"
				fill="none"
				r="3"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	EyeOff: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="1"
				x2="23"
				y1="1"
				y2="23"
			/>
		</SVGIcon>
	),

	Trash2: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polyline
				fill="none"
				points="3 6 5 6 21 6"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path
				d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="10"
				x2="10"
				y1="11"
				y2="17"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="14"
				x2="14"
				y1="11"
				y2="17"
			/>
		</SVGIcon>
	),

	Edit: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path
				d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	CreditCard: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<rect
				fill="none"
				height="16"
				stroke="currentColor"
				strokeWidth="2"
				width="22"
				x="1"
				y="4"
			/>
			<line
				stroke="currentColor"
				strokeWidth="2"
				x1="1"
				x2="23"
				y1="10"
				y2="10"
			/>
		</SVGIcon>
	),

	Wallet: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M21 12V7H5a2 2 0 0 1 0-4h14v4"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path
				d="M3 5v14a2 2 0 0 0 2 2h16v-5"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<circle cx="18" cy="12" fill="currentColor" r="2" />
		</SVGIcon>
	),

	TrendingUp: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polyline
				fill="none"
				points="23 6 13.5 15.5 8.5 10.5 1 18"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="17 6 23 6 23 12"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	TrendingDown: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polyline
				fill="none"
				points="23 18 13.5 8.5 8.5 13.5 1 6"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="17 18 23 18 23 12"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	BarChart: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12"
				y1="20"
				y2="10"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="18"
				x2="18"
				y1="20"
				y2="4"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="6"
				x2="6"
				y1="20"
				y2="14"
			/>
		</SVGIcon>
	),

	PieChart: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M21.21 15.89A10 10 0 1 1 8 2.83"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
			<path d="M22 12A10 10 0 0 0 12 2v10z" fill="currentColor" />
		</SVGIcon>
	),

	Activity: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polyline
				fill="none"
				points="22 12 18 12 15 21 9 3 6 12 2 12"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Zap: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polygon
				fill="currentColor"
				points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
			/>
		</SVGIcon>
	),

	Globe: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<circle
				cx="12"
				cy="12"
				fill="none"
				r="10"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeWidth="2"
				x1="2"
				x2="22"
				y1="12"
				y2="12"
			/>
			<path
				d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Link: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path
				d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Copy: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<rect
				fill="none"
				height="13"
				rx="2"
				stroke="currentColor"
				strokeWidth="2"
				width="13"
				x="9"
				y="9"
			/>
			<path
				d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Info: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<circle
				cx="12"
				cy="12"
				fill="none"
				r="10"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12"
				y1="16"
				y2="12"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12.01"
				y1="8"
				y2="8"
			/>
		</SVGIcon>
	),

	AlertCircle: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<circle
				cx="12"
				cy="12"
				fill="none"
				r="10"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12"
				y1="8"
				y2="12"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12.01"
				y1="16"
				y2="16"
			/>
		</SVGIcon>
	),

	CheckCircle: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="22 4 12 14.01 9 11.01"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Loader: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12"
				y1="2"
				y2="6"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12"
				y1="18"
				y2="22"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="4.93"
				x2="7.76"
				y1="4.93"
				y2="7.76"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="16.24"
				x2="19.07"
				y1="16.24"
				y2="19.07"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="2"
				x2="6"
				y1="12"
				y2="12"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="18"
				x2="22"
				y1="12"
				y2="12"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="4.93"
				x2="7.76"
				y1="19.07"
				y2="16.24"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="16.24"
				x2="19.07"
				y1="7.76"
				y2="4.93"
			/>
		</SVGIcon>
	),

	Lock: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<rect
				fill="none"
				height="11"
				rx="2"
				stroke="currentColor"
				strokeWidth="2"
				width="18"
				x="3"
				y="11"
			/>
			<path
				d="M7 11V7a5 5 0 0 1 10 0v4"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Unlock: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<rect
				fill="none"
				height="11"
				rx="2"
				stroke="currentColor"
				strokeWidth="2"
				width="18"
				x="3"
				y="11"
			/>
			<path
				d="M7 11V7a5 5 0 0 1 9.9-1"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Mail: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="22,6 12,13 2,6"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Phone: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Home: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="9 22 9 12 15 12 15 22"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	File: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<polyline
				fill="none"
				points="13 2 13 9 20 9"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Folder: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Image: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<rect
				fill="none"
				height="18"
				rx="2"
				stroke="currentColor"
				strokeWidth="2"
				width="18"
				x="3"
				y="3"
			/>
			<circle cx="8.5" cy="8.5" fill="currentColor" r="1.5" />
			<polyline
				fill="none"
				points="21 15 16 10 5 21"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Star: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<polygon
				fill="none"
				points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Heart: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	StarHalf: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<path
				d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	HelpCircle: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<circle
				cx="12"
				cy="12"
				fill="none"
				r="10"
				stroke="currentColor"
				strokeWidth="2"
			/>
			<path
				d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
			/>
			<line
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2"
				x1="12"
				x2="12.01"
				y1="17"
				y2="17"
			/>
		</SVGIcon>
	),

	Settings2: (props: SVGIconProps) => (
		<SVGIcon {...props}>
			<circle cx="12" cy="12" fill="currentColor" r="3" />
			<path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</SVGIcon>
	),

	Spinner: (props: SVGIconProps) => (
		<SVGIcon {...props} className={`animate-spin ${props.className || ""}`}>
			<circle
				cx="12"
				cy="12"
				fill="none"
				r="10"
				stroke="currentColor"
				strokeDasharray="32"
				strokeDashoffset="12"
				strokeWidth="2"
			/>
		</SVGIcon>
	),
};
